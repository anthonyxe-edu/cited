"use client";

import React, { useEffect, useRef } from "react";

interface ShaderBackgroundProps {
  opacity?: number;
}

const VS_SOURCE = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;

// Fragment shader — CITED teal line color, dark background matching #0A1628
const FS_SOURCE = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  const float overallSpeed      = 0.15;
  const float gridSmoothWidth   = 0.015;
  const float axisWidth         = 0.05;
  const float majorLineWidth    = 0.025;
  const float minorLineWidth    = 0.0125;
  const float majorLineFreq     = 5.0;
  const float minorLineFreq     = 1.0;
  const float scale             = 5.0;

  // CITED teal: #00D4AA = (0.0, 0.831, 0.667)
  const vec4 lineColor          = vec4(0.0, 0.831, 0.667, 1.0);

  const float minLineWidth      = 0.01;
  const float maxLineWidth      = 0.18;
  const float lineSpeed         = 1.0  * overallSpeed;
  const float lineAmplitude     = 1.0;
  const float lineFrequency     = 0.2;
  const float warpSpeed         = 0.2  * overallSpeed;
  const float warpFrequency     = 0.5;
  const float warpAmplitude     = 1.0;
  const float offsetFrequency   = 0.5;
  const float offsetSpeed       = 1.33 * overallSpeed;
  const float minOffsetSpread   = 0.6;
  const float maxOffsetSpread   = 2.0;
  const int   linesPerGroup     = 16;

  #define drawSmoothLine(pos, halfWidth, t)   smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t)    smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
  #define drawCircle(pos, radius, coord)      smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float hFade, float offset) {
    return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
  }

  void main() {
    vec2 uv    = gl_FragCoord.xy / iResolution.xy;
    vec2 space = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.x * 2.0 * scale;

    float hFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float vFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + hFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * hFade;

    // Background: #0A1628 = (0.039, 0.086, 0.157)
    vec4 bgA = vec4(0.039, 0.086, 0.157, 1.0);
    vec4 bgB = vec4(0.051, 0.11,  0.2,   1.0);

    vec4 lines = vec4(0.0);
    for (int l = 0; l < linesPerGroup; l++) {
      float nli            = float(l) / float(linesPerGroup);
      float offsetPos      = float(l) + space.x * offsetFrequency;
      float rand           = random(offsetPos + iTime * offsetSpeed) * 0.5 + 0.5;
      float halfWidth      = mix(minLineWidth, maxLineWidth, rand * hFade) * 0.5;
      float offset         = random(offsetPos + iTime * offsetSpeed * (1.0 + nli))
                             * mix(minOffsetSpread, maxOffsetSpread, hFade);
      float linePos        = getPlasmaY(space.x, hFade, offset);
      float line           = drawSmoothLine(linePos, halfWidth, space.y) * 0.5
                           + drawCrispLine(linePos, halfWidth * 0.15, space.y);

      float cx             = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2  cp             = vec2(cx, getPlasmaY(cx, hFade, offset));
      float circle         = drawCircle(cp, 0.01, space) * 4.0;

      lines += (line + circle) * lineColor * rand;
    }

    vec4 col  = mix(bgA, bgB, uv.x);
    col      *= vFade;
    col.a     = 1.0;
    col      += lines;

    gl_FragColor = col;
  }
`;

function loadShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initShaderProgram(
  gl: WebGLRenderingContext,
  vs: string,
  fs: string
): WebGLProgram | null {
  const vert = loadShader(gl, gl.VERTEX_SHADER, vs);
  const frag = loadShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!vert || !frag) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export function ShaderBackground({ opacity = 0.3 }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const program = initShaderProgram(gl, VS_SOURCE, FS_SOURCE);
    if (!program) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const vertexLoc   = gl.getAttribLocation(program, "aVertexPosition");
    const resLoc      = gl.getUniformLocation(program, "iResolution");
    const timeLoc     = gl.getUniformLocation(program, "iTime");

    function resize() {
      if (!canvas || !gl) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    window.addEventListener("resize", resize);
    resize();

    let raf: number;
    const start = Date.now();

    function render() {
      if (!gl || !canvas) return;
      const t = (Date.now() - start) / 1000;

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexLoc);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        display: "block",
        pointerEvents: "none",
      }}
    />
  );
}
