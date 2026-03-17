"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC      = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY = 2200;
const POINTS         = 128;
const CHIME_DELAY    = 400;
const FORM_MS        = 1200;

// Where the waveform zone lives (fraction of width) — tight center only
const WAVE_START = 0.32;
const WAVE_END   = 0.68;

/* ── sparkle chime via Web Audio API ────────────────────────────────────────── */
function playChime(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = new AudioContext();
    ref.current = ctx;
    const now = ctx.currentTime;

    // Main sparkle — triangle wave with downward sweep
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(4200, now);
    o1.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
    o1.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
    g1.gain.setValueAtTime(0.07, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o1.connect(g1).connect(ctx.destination);
    o1.start(now);
    o1.stop(now + 0.5);

    // High shimmer
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.value = 6000;
    g2.gain.setValueAtTime(0.025, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o2.connect(g2).connect(ctx.destination);
    o2.start(now);
    o2.stop(now + 0.25);

    // Warm undertone
    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = "sine";
    o3.frequency.value = 1200;
    g3.gain.setValueAtTime(0.04, now + 0.05);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o3.connect(g3).connect(ctx.destination);
    o3.start(now + 0.05);
    o3.stop(now + 0.6);
  } catch {
    /* autoplay policy — chime is best-effort */
  }
}

/* ── canvas waveform ────────────────────────────────────────────────────────── */
function drawWave(
  canvas: HTMLCanvasElement,
  active: boolean,
  isDark: boolean,
  t: number,
  amp: number,
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

  if (!active || amp < 0.005) return;

  const cy    = H / 2;
  const teal  = isDark ? "0,180,145"   : "0,107,87";
  const white = isDark ? "0,212,170"   : "0,140,112";

  /* Build Y-values: flat at edges, smooth sine-wave in center zone */
  const ys: number[] = Array.from({ length: POINTS }, (_, i) => {
    const pos = i / (POINTS - 1);

    // Edge opacity fade (matches the CSS gradient transparent → color → transparent)
    const edgeFade = Math.min(pos / 0.06, 1) * Math.min((1 - pos) / 0.06, 1);

    // Waveform zone: steep power-curve envelope — peaks sharply in center, subsides fast
    let waveFade = 0;
    if (pos > WAVE_START && pos < WAVE_END) {
      const zonePos = (pos - WAVE_START) / (WAVE_END - WAVE_START);
      waveFade = Math.pow(Math.sin(zonePos * Math.PI), 2.5);
    }

    // Layered sine waves — organic, non-repeating feel
    const wave =
      Math.sin(pos * Math.PI * 3   + t * 2.1) * 0.48 +
      Math.sin(pos * Math.PI * 5   + t * 1.3) * 0.30 +
      Math.sin(pos * Math.PI * 1.5 + t * 2.8) * 0.22;

    return cy + wave * waveFade * edgeFade * cy * 0.88 * amp;
  });

  /* Gradient that exactly replicates the CSS line */
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

  /* Pass 1 — blurred outer glow (≈ CSS blur-sm line) */
  buildPath();
  ctx.strokeStyle = `rgba(${teal},0.7)`;
  ctx.lineWidth   = 3;
  ctx.filter      = "blur(1px)";
  ctx.stroke();
  ctx.filter      = "none";

  /* Pass 2 — sharp gradient core (≈ CSS h-px line) */
  buildPath();
  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = `rgba(${white},0.8)`;
  ctx.shadowBlur  = 3;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  /* Pass 3 — center hot glow (≈ CSS center hotspot) */
  buildPath();
  ctx.strokeStyle = `rgba(${white},0.5)`;
  ctx.lineWidth   = 2;
  ctx.filter      = "blur(1.5px)";
  ctx.stroke();
  ctx.filter      = "none";
}

/* ── component ──────────────────────────────────────────────────────────────── */
interface CitHeroProps {
  onEnded?: () => void;
}

export function CitHero({ onEnded }: CitHeroProps) {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<
    "idle" | "playing" | "paused" | "ended" | "blocked"
  >("idle");
  const [lineFormed, setLineFormed] = useState(false);

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const animRef     = useRef<number | null>(null);
  const isDarkRef   = useRef(isDark);
  isDarkRef.current = isDark;
  const timeRef     = useRef(0);
  const ampRef      = useRef(0);
  const chimeCtxRef = useRef<AudioContext | null>(null);

  /* ---- animation loop ---- */
  function startViz() {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;

    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);

      timeRef.current += 0.018;

      if (data) {
        const rms = Math.sqrt(
          data.reduce((s, v) => s + Math.pow((v - 128) / 128, 2), 0) / data.length,
        );
        ampRef.current = ampRef.current * 0.72 + rms * 0.28;
      }

      if (canvasRef.current) {
        drawWave(
          canvasRef.current,
          true,
          isDarkRef.current,
          timeRef.current,
          Math.min(ampRef.current * 14, 1),
        );
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function stopViz() {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    ampRef.current = 0;
    if (canvasRef.current) {
      drawWave(canvasRef.current, false, isDarkRef.current, timeRef.current, 0);
    }
  }

  /* ---- playback ---- */
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
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
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

  /* ---- lifecycle ---- */
  useEffect(() => {
    // Phase 1: chime + line formation
    const chimeT = setTimeout(() => {
      playChime(chimeCtxRef);
      setLineFormed(true);
    }, CHIME_DELAY);

    // Phase 2: audio autoplay
    const audio      = new Audio(AUDIO_SRC);
    audio.preload    = "auto";
    audioRef.current = audio;
    audio.onended    = () => {
      stopViz();
      setStatus("ended");
      onEnded?.();
    };
    const playT = setTimeout(() => play(), AUTOPLAY_DELAY);

    return () => {
      clearTimeout(chimeT);
      clearTimeout(playT);
      audio.pause();
      stopViz();
      audioCtxRef.current?.close();
      chimeCtxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  /* ---- derived state ---- */
  const isPlaying = status === "playing";
  const teal80    = isDark ? "rgba(0,212,170,0.8)" : "rgba(0,107,87,0.7)";
  const teal60    = isDark ? "rgba(0,212,170,0.6)" : "rgba(0,107,87,0.5)";
  const white90   = isDark ? "rgba(0,229,181,0.9)" : "rgba(0,155,120,0.8)";

  // Formation: expands from center point
  const lineClip = lineFormed ? "inset(0 0% 0 0%)" : "inset(0 50% 0 50%)";

  return (
    <div
      onClick={toggle}
      style={{
        position: "relative",
        width: "100%",
        height: 100,
        cursor: "pointer",
        clipPath: lineClip,
        transition: `clip-path ${FORM_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {/* ── CSS gradient lines (the static line — preserved exactly) ── */}

      {/* Outer blurred line */}
      <div
        style={{
          position: "absolute", top: "50%", left: "8%", right: "8%",
          height: 2, transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${teal80}, transparent)`,
          filter: "blur(1px)",
          opacity: isPlaying ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />
      {/* Outer sharp line */}
      <div
        style={{
          position: "absolute", top: "50%", left: "8%", right: "8%",
          height: 1, transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${teal60}, transparent)`,
          opacity: isPlaying ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />
      {/* Center blurred hotspot */}
      <div
        style={{
          position: "absolute", top: "50%", left: "30%", right: "30%",
          height: 5, transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${white90}, transparent)`,
          filter: "blur(2px)",
          opacity: isPlaying ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />
      {/* Center sharp hotspot */}
      <div
        style={{
          position: "absolute", top: "50%", left: "30%", right: "30%",
          height: 1, transform: "translateY(-50%)",
          background: `linear-gradient(90deg, transparent, ${white90}, transparent)`,
          opacity: isPlaying ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* ── Canvas waveform (takes over seamlessly when Cit speaks) ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: isPlaying ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
    </div>
  );
}
