'use client';

import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useAspect } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three/webgpu';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { Mesh } from 'three';
import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  pass,
  mix,
  add,
} from 'three/tsl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

// ── Canvas texture helpers ─────────────────────────────────────────────────

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createCitedMarkTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark navy background
  ctx.fillStyle = '#060E1A';
  ctx.fillRect(0, 0, size, size);

  // Radial background glow
  const bg = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  bg.addColorStop(0, 'rgba(0,212,170,0.18)');
  bg.addColorStop(0.5, 'rgba(0,212,170,0.05)');
  bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  const scale = size / 100;
  const r = 10 * scale;

  // Teal gradient fill
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#00E5B5');
  grad.addColorStop(1, '#00B894');
  ctx.fillStyle = grad;

  // Vertical bar
  roundedRect(ctx, 31.5 * scale, 0, 37 * scale, 100 * scale, r);
  ctx.fill();

  // Horizontal bar
  roundedRect(ctx, 0, 31.5 * scale, 100 * scale, 37 * scale, r);
  ctx.fill();

  // Soft inner glow pass
  ctx.globalAlpha = 0.35;
  ctx.shadowBlur = 40;
  ctx.shadowColor = '#00D4AA';
  ctx.fillStyle = '#00E5B5';
  roundedRect(ctx, 31.5 * scale, 0, 37 * scale, 100 * scale, r);
  ctx.fill();
  roundedRect(ctx, 0, 31.5 * scale, 100 * scale, 37 * scale, r);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createDepthMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  const scale = size / 100;
  ctx.shadowBlur = 28;
  ctx.shadowColor = 'white';
  ctx.fillStyle = 'white';

  roundedRect(ctx, 31.5 * scale, 0, 37 * scale, 100 * scale, 10 * scale);
  ctx.fill();
  roundedRect(ctx, 0, 31.5 * scale, 100 * scale, 37 * scale, 10 * scale);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ── Post Processing (bloom + CITED green scan line) ────────────────────────

const PostProcessing = ({
  strength = 1,
  threshold = 1,
  fullScreenEffect = true,
}: {
  strength?: number;
  threshold?: number;
  fullScreenEffect?: boolean;
}) => {
  const { gl, scene, camera } = useThree();
  const progressRef = useRef({ value: 0 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const render = useMemo<any>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postProcessing = new (THREE as any).PostProcessing(gl as any);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    const uScanProgress = uniform(0);
    progressRef.current = uScanProgress as unknown as { value: number };

    const uvY = uv().y;
    const scanWidth = float(0.05);
    const scanLine = smoothstep(
      0 as unknown as ReturnType<typeof float>,
      scanWidth,
      abs(uvY.sub(float(uScanProgress.value))),
    );

    // CITED green: #00D4AA = (0, 0.831, 0.667)
    const greenOverlay = vec3(0, 0.831, 0.667)
      .mul(oneMinus(scanLine))
      .mul(0.4);

    const withScan = mix(
      scenePassColor,
      add(scenePassColor, greenOverlay),
      fullScreenEffect ? smoothstep(0.9, 1.0, oneMinus(scanLine)) : 1.0,
    );

    postProcessing.outputNode = withScan.add(bloomPass);
    return postProcessing;
  }, [camera, gl, scene, strength, threshold, fullScreenEffect]);

  useFrame(({ clock }) => {
    progressRef.current.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    render.renderAsync();
  }, 1);

  return null;
};

// ── Scene (CitedMark with green dot-matrix scan) ───────────────────────────

const WIDTH  = 300;
const HEIGHT = 300;

const Scene = () => {
  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);

  const { material, uniforms } = useMemo(() => {
    const rawMap   = createCitedMarkTexture();
    const depthMap = createDepthMap();

    const uPointer  = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const tDepthMap = texture(depthMap);
    const tMap = texture(
      rawMap,
      uv().add(tDepthMap.r.mul(uPointer).mul(0.01)),
    );

    const aspect   = float(WIDTH).div(HEIGHT);
    const tUv      = vec2(uv().x.mul(aspect), uv().y);
    const tiling   = vec2(120.0);
    const tiledUv  = mod(tUv.mul(tiling), 2.0).sub(1.0);
    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));
    const dist     = float(tiledUv.length());
    const dot      = float(smoothstep(0.5, 0.49, dist)).mul(brightness);
    const flow     = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.r.sub(uProgress))));

    // CITED green overbright dots for bloom
    const mask  = dot.mul(flow).mul(vec3(0, 8.31, 6.67));
    const final = blendScreen(tMap, mask);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = new (THREE as any).MeshBasicNodeMaterial({
      colorNode: final,
      transparent: true,
      opacity: 0,
    });

    return { material: mat, uniforms: { uPointer, uProgress } };
  }, []);

  useEffect(() => { setVisible(true); }, []);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock }) => {
    uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    if (meshRef.current?.material) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mat = meshRef.current.material as any;
      if ('opacity' in mat) {
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, visible ? 1 : 0, 0.07);
      }
    }
  });

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  return (
    <mesh ref={meshRef} scale={[w * 0.40, h * 0.40, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

// ── Main export ────────────────────────────────────────────────────────────

export function HeroCanvas() {
  return (
    <Canvas
      flat
      style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      gl={async (props) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const renderer = new (THREE as any).WebGPURenderer(props as any);
        await renderer.init();
        return renderer;
      }}
    >
      <PostProcessing fullScreenEffect />
      <Scene />
    </Canvas>
  );
}
