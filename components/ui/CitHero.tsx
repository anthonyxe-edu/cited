"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC        = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY   = 2200;
const SAMPLE_COUNT     = 180; // points along the wave

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

  // Build Y values along the wave
  const ys: number[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    if (data && active) {
      const idx = Math.floor((i / SAMPLE_COUNT) * data.length);
      const v   = (data[idx] - 128) / 128;
      ys.push(cy + v * cy * 0.88);
    } else {
      ys.push(cy);
    }
  }

  // ── Edge-fade gradient for the stroke ──────────────────────────────────
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  if (isDark) {
    grad.addColorStop(0,    "rgba(0,212,170,0)");
    grad.addColorStop(0.08, "rgba(0,212,170,0.55)");
    grad.addColorStop(0.38, "rgba(0,220,176,0.9)");
    grad.addColorStop(0.5,  "rgba(200,255,240,1)");    // hot white-teal center
    grad.addColorStop(0.62, "rgba(0,220,176,0.9)");
    grad.addColorStop(0.92, "rgba(0,212,170,0.55)");
    grad.addColorStop(1,    "rgba(0,212,170,0)");
  } else {
    grad.addColorStop(0,    "rgba(0,80,64,0)");
    grad.addColorStop(0.08, "rgba(0,107,87,0.55)");
    grad.addColorStop(0.38, "rgba(0,140,112,0.9)");
    grad.addColorStop(0.5,  "rgba(0,180,140,1)");
    grad.addColorStop(0.62, "rgba(0,140,112,0.9)");
    grad.addColorStop(0.92, "rgba(0,107,87,0.55)");
    grad.addColorStop(1,    "rgba(0,80,64,0)");
  }

  // ── Draw path helper ───────────────────────────────────────────────────
  function buildPath() {
    ctx!.beginPath();
    ctx!.moveTo(0, ys[0]);
    for (let i = 1; i < ys.length; i++) {
      const x0 = ((i - 1) / (SAMPLE_COUNT - 1)) * W;
      const x1 = (i       / (SAMPLE_COUNT - 1)) * W;
      const mx = (x0 + x1) / 2;
      ctx!.quadraticCurveTo(x0, ys[i - 1], mx, (ys[i - 1] + ys[i]) / 2);
    }
    ctx!.lineTo(W, ys[ys.length - 1]);
  }

  // ── Pass 1: wide outer glow ────────────────────────────────────────────
  buildPath();
  ctx.strokeStyle = isDark ? "rgba(0,212,170,0.12)" : "rgba(0,107,87,0.1)";
  ctx.lineWidth   = 18;
  ctx.shadowColor = isDark ? "rgba(0,212,170,0.25)" : "rgba(0,107,87,0.2)";
  ctx.shadowBlur  = 28;
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";
  ctx.stroke();

  // ── Pass 2: mid glow ──────────────────────────────────────────────────
  buildPath();
  ctx.strokeStyle = isDark ? "rgba(0,212,170,0.25)" : "rgba(0,140,112,0.22)";
  ctx.lineWidth   = 6;
  ctx.shadowColor = isDark ? "#00D4AA" : "#006B57";
  ctx.shadowBlur  = 14;
  ctx.stroke();

  // ── Pass 3: bright core ───────────────────────────────────────────────
  buildPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = isDark ? "rgba(200,255,240,0.8)" : "rgba(0,180,140,0.6)";
  ctx.shadowBlur  = 8;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // ── Center hotspot ────────────────────────────────────────────────────
  const cx    = W / 2;
  const peakY = ys[Math.floor(SAMPLE_COUNT / 2)];
  const spot  = ctx.createRadialGradient(cx, peakY, 0, cx, peakY, W * 0.18);
  if (isDark) {
    spot.addColorStop(0,   "rgba(220,255,245,0.22)");
    spot.addColorStop(0.4, "rgba(0,212,170,0.1)");
    spot.addColorStop(1,   "rgba(0,212,170,0)");
  } else {
    spot.addColorStop(0,   "rgba(0,180,140,0.15)");
    spot.addColorStop(0.4, "rgba(0,107,87,0.07)");
    spot.addColorStop(1,   "rgba(0,107,87,0)");
  }
  ctx.fillStyle = spot;
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
        analyser.smoothingTimeConstant = 0.88;
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

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  useEffect(() => {
    const audio      = new Audio(AUDIO_SRC);
    audio.preload    = "auto";
    audioRef.current = audio;

    audio.onended = () => {
      stopViz();
      setStatus("ended");
      onEnded?.();
    };

    const t = setTimeout(() => play(), AUTOPLAY_DELAY);
    return () => { clearTimeout(t); audio.pause(); stopViz(); audioCtxRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (status !== "playing" && canvasRef.current) {
      drawLine(canvasRef.current, null, false, isDark);
    }
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      onClick={toggle}
      style={{
        width: "100%",
        height: 90,
        display: "block",
        cursor: "pointer",
      }}
    />
  );
}
