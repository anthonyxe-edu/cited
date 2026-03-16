"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
import { SparklesCore } from "@/components/ui/sparkles";

const AUDIO_SRC      = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY = 2200;
const POINTS         = 256;

// Tight gaussian — peaks only in center ~30% of width
function gauss(pos: number) {
  return Math.exp(-Math.pow((pos - 0.5) * 8, 2));
}

// Draw ONLY the waveform peaks over the CSS line (transparent when idle)
function drawPeaks(
  canvas: HTMLCanvasElement,
  data: Uint8Array | null,
  active: boolean,
  isDark: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = canvas.offsetHeight;
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }
  ctx.clearRect(0, 0, W, H);

  if (!active || !data) return; // CSS line handles idle state

  const cy = H / 2;
  const teal  = isDark ? "0,212,170"   : "0,107,87";
  const white = isDark ? "200,255,240" : "0,160,130";

  // Build wave Y values with gaussian center envelope
  const ys: number[] = Array.from({ length: POINTS }, (_, i) => {
    const pos = i / (POINTS - 1);
    const idx = Math.floor(pos * data.length);
    const raw = (data[idx] - 128) / 128;
    return cy + raw * gauss(pos) * cy * 0.88;
  });

  // Match the CSS gradient line style exactly
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    `rgba(${teal},0)`);
  grad.addColorStop(0.06, `rgba(${teal},0.7)`);
  grad.addColorStop(0.28, `rgba(${teal},0.9)`);
  grad.addColorStop(0.5,  `rgba(${white},1)`);
  grad.addColorStop(0.72, `rgba(${teal},0.9)`);
  grad.addColorStop(0.94, `rgba(${teal},0.7)`);
  grad.addColorStop(1,    `rgba(${teal},0)`);

  ctx.lineJoin = "round";
  ctx.lineCap  = "round";

  function buildPath() {
    ctx!.beginPath();
    ctx!.moveTo(0, ys[0]);
    for (let i = 1; i < POINTS; i++) {
      const x0 = ((i - 1) / (POINTS - 1)) * W;
      const x1 = (i       / (POINTS - 1)) * W;
      const mx = (x0 + x1) / 2;
      ctx!.quadraticCurveTo(x0, ys[i - 1], mx, (ys[i - 1] + ys[i]) / 2);
    }
    ctx!.lineTo(W, ys[POINTS - 1]);
  }

  // Blurred outer pass — matches the `blur-sm` CSS line
  buildPath();
  ctx.strokeStyle = `rgba(${teal},0.7)`;
  ctx.lineWidth   = 3;
  ctx.filter      = "blur(1px)";
  ctx.stroke();
  ctx.filter      = "none";

  // Sharp 1px core — matches the `h-px` CSS line
  buildPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1;
  ctx.shadowColor = `rgba(${white},0.8)`;
  ctx.shadowBlur  = 2;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Center hot pass — matches the `h-[5px] blur-sm` CSS center line
  buildPath();
  ctx.strokeStyle = `rgba(${white},0.6)`;
  ctx.lineWidth   = 2;
  ctx.filter      = "blur(1.5px)";
  ctx.stroke();
  ctx.filter      = "none";
}

interface CitHeroProps {
  onEnded?: () => void;
}

export function CitHero({ onEnded }: CitHeroProps) {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "ended" | "blocked">("idle");

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const animRef     = useRef<number | null>(null);
  const isDarkRef   = useRef(isDark);
  isDarkRef.current = isDark;

  function startViz() {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;
    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);
      if (canvasRef.current) drawPeaks(canvasRef.current, data, true, isDarkRef.current);
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function stopViz() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (canvasRef.current) drawPeaks(canvasRef.current, null, false, isDarkRef.current);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const ctx      = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.82;
        ctx.createMediaElementSource(audio).connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
      if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
      await audio.play();
      setStatus("playing");
      startViz();
    } catch {
      setStatus("blocked");
    }
  }

  function pause() {
    audioRef.current?.pause();
    stopViz();
    setStatus("paused");
  }

  useEffect(() => {
    const audio      = new Audio(AUDIO_SRC);
    audio.preload    = "auto";
    audioRef.current = audio;
    audio.onended    = () => { stopViz(); setStatus("ended"); onEnded?.(); };
    const t = setTimeout(() => play(), AUTOPLAY_DELAY);
    return () => { clearTimeout(t); audio.pause(); stopViz(); audioCtxRef.current?.close(); };
  }, []);

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  const tealColor  = isDark ? "#00D4AA" : "#006B57";
  const teal80     = isDark ? "rgba(0,212,170,0.8)" : "rgba(0,107,87,0.7)";
  const teal60     = isDark ? "rgba(0,212,170,0.6)" : "rgba(0,107,87,0.5)";
  const white90    = isDark ? "rgba(0,229,181,0.9)" : "rgba(0,155,120,0.8)";

  return (
    <div
      onClick={toggle}
      style={{ position: "relative", width: "100%", height: 100, cursor: "pointer" }}
    >
      {/* CSS gradient lines — exact SparklesPreview pattern, centered */}

      {/* Outer blurred line */}
      <div style={{
        position: "absolute", top: "50%", left: "8%", right: "8%",
        height: 2, transform: "translateY(-50%)",
        background: `linear-gradient(90deg, transparent, ${teal80}, transparent)`,
        filter: "blur(1px)",
      }} />
      {/* Outer sharp line */}
      <div style={{
        position: "absolute", top: "50%", left: "8%", right: "8%",
        height: 1, transform: "translateY(-50%)",
        background: `linear-gradient(90deg, transparent, ${teal60}, transparent)`,
      }} />
      {/* Center blurred hotspot */}
      <div style={{
        position: "absolute", top: "50%", left: "30%", right: "30%",
        height: 5, transform: "translateY(-50%)",
        background: `linear-gradient(90deg, transparent, ${white90}, transparent)`,
        filter: "blur(2px)",
      }} />
      {/* Center sharp hotspot */}
      <div style={{
        position: "absolute", top: "50%", left: "30%", right: "30%",
        height: 1, transform: "translateY(-50%)",
        background: `linear-gradient(90deg, transparent, ${white90}, transparent)`,
      }} />

      {/* SparklesCore — particles scattered around the line */}
      <SparklesCore
        background="transparent"
        minSize={0.3}
        maxSize={0.9}
        particleDensity={500}
        particleColor={tealColor}
        speed={1.2}
        className="absolute inset-0 w-full h-full"
      />

      {/* Radial mask — fades particles away from line (matches demo pattern) */}
      <div style={{
        position: "absolute", inset: 0,
        background: isDark
          ? "radial-gradient(500px 60px at center, transparent 30%, #000 100%)"
          : "radial-gradient(500px 60px at center, transparent 30%, #fff 100%)",
        pointerEvents: "none",
      }} />

      {/* Canvas — draws waveform peaks on top when Cit speaks */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
