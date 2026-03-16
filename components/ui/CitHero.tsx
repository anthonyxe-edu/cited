"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC      = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY = 2200;
const POINTS         = 256;

// Tight gaussian — peaks only in center ~30% of width
function envelope(pos: number) {
  return Math.exp(-Math.pow((pos - 0.5) * 8, 2));
}

function drawLine(
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

  const cy = H / 2;

  // Build Y values: flat when idle, gaussian-peaked center when active
  const ys: number[] = Array.from({ length: POINTS }, (_, i) => {
    if (!data || !active) return cy;
    const pos = i / (POINTS - 1);
    const idx = Math.floor(pos * data.length);
    const raw = (data[idx] - 128) / 128;
    return cy + raw * envelope(pos) * cy * 0.9;
  });

  // Gradient: fade transparent → teal → white-teal center → teal → transparent
  const teal  = isDark ? "0,212,170"   : "0,107,87";
  const white = isDark ? "210,255,240" : "0,160,130";
  const grad  = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    `rgba(${teal},0)`);
  grad.addColorStop(0.06, `rgba(${teal},0.6)`);
  grad.addColorStop(0.3,  `rgba(${teal},0.9)`);
  grad.addColorStop(0.5,  `rgba(${white},1)`);
  grad.addColorStop(0.7,  `rgba(${teal},0.9)`);
  grad.addColorStop(0.94, `rgba(${teal},0.6)`);
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

  // Pass 1 — thin tight halo (not wide/boxy)
  buildPath();
  ctx.strokeStyle = `rgba(${teal},0.18)`;
  ctx.lineWidth   = 4;
  ctx.shadowColor = `rgba(${teal},0.4)`;
  ctx.shadowBlur  = 5;
  ctx.stroke();

  // Pass 2 — sharp 1.5px core with gradient
  buildPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = `rgba(${white},0.85)`;
  ctx.shadowBlur  = 3;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Small precise center bloom
  const peakAmt = active && data ? Math.abs((data[data.length >> 1] - 128) / 128) : 0;
  const bloom   = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, H * (1.2 + peakAmt));
  bloom.addColorStop(0,   `rgba(${white},${0.1 + peakAmt * 0.08})`);
  bloom.addColorStop(0.5, `rgba(${teal},0.04)`);
  bloom.addColorStop(1,   `rgba(${teal},0)`);
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);
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
      if (canvasRef.current) drawLine(canvasRef.current, data, true, isDarkRef.current);
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function stopViz() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (canvasRef.current) drawLine(canvasRef.current, null, false, isDarkRef.current);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const ctx      = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;
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

  useEffect(() => {
    if (status !== "playing" && canvasRef.current) {
      drawLine(canvasRef.current, null, false, isDark);
    }
  }, [isDark]);

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={toggle}
      style={{ width: "100%", height: 90, display: "block", cursor: "pointer" }}
    />
  );
}
