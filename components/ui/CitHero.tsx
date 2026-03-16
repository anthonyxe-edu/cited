"use client";

import { useEffect, useRef, useState } from "react";

const AUDIO_SRC = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY_MS = 2200;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function drawWave(canvas: HTMLCanvasElement, data: Uint8Array | null, active: boolean) {
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

  if (!data || !active) {
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
    ctx.stroke();
    return;
  }

  const amp  = H * 0.44;
  const step = W / (data.length - 1);

  // Main wave
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    const x = i * step;
    const y = cy + v * amp;
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      const px = (i - 1) * step;
      const pv = (data[i - 1] - 128) / 128;
      ctx.quadraticCurveTo(px, cy + pv * amp, (px + x) / 2, (cy + pv * amp + cy + v * amp) / 2);
    }
  }
  ctx.lineTo(W, cy + ((data[data.length - 1] - 128) / 128) * amp);

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    "rgba(0,212,170,0)");
  grad.addColorStop(0.12, "rgba(0,212,170,0.7)");
  grad.addColorStop(0.5,  "rgba(0,229,181,1)");
  grad.addColorStop(0.88, "rgba(0,212,170,0.7)");
  grad.addColorStop(1,    "rgba(0,212,170,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.shadowColor = "#00D4AA"; ctx.shadowBlur = 14;
  ctx.stroke();

  // Bright core
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    const x = i * step;
    const y = cy + v * amp;
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      const px = (i - 1) * step;
      const pv = (data[i - 1] - 128) / 128;
      ctx.quadraticCurveTo(px, cy + pv * amp, (px + x) / 2, (cy + pv * amp + cy + v * amp) / 2);
    }
  }
  ctx.strokeStyle = "rgba(200,255,240,0.3)";
  ctx.lineWidth = 1; ctx.shadowBlur = 5;
  ctx.stroke();
}

export function CitHero() {
  const [status, setStatus]     = useState<"idle" | "playing" | "paused" | "ended" | "blocked">("idle");
  const [duration, setDuration] = useState(0);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const fillRef      = useRef<HTMLDivElement | null>(null);
  const thumbRef     = useRef<HTMLDivElement | null>(null);
  const timeRef      = useRef<HTMLSpanElement | null>(null);
  const animRef      = useRef<number | null>(null);
  const scrubRef     = useRef<HTMLDivElement | null>(null);

  function startViz() {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;
    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);
      if (canvasRef.current) drawWave(canvasRef.current, data, true);
      const a = audioRef.current;
      if (a && a.duration > 0) {
        const pct = (a.currentTime / a.duration) * 100;
        if (fillRef.current)  fillRef.current.style.width  = `${pct}%`;
        if (thumbRef.current) thumbRef.current.style.left  = `${pct}%`;
        if (timeRef.current)  timeRef.current.textContent  = formatTime(a.currentTime);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function stopViz() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (canvasRef.current) drawWave(canvasRef.current, null, false);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      // Wire Web Audio on first play
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

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    const el = scrubRef.current;
    if (!a || !el || !a.duration) return;
    const r   = el.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min((e.clientX - r.left) / r.width, 1)) * a.duration;
  }

  // Set up audio element once
  useEffect(() => {
    const audio      = new Audio(AUDIO_SRC);
    audio.preload    = "auto";
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onended = () => {
      stopViz();
      setStatus("ended");
      if (fillRef.current)  fillRef.current.style.width  = "100%";
      if (thumbRef.current) thumbRef.current.style.left  = "100%";
      if (timeRef.current && audio.duration)
        timeRef.current.textContent = formatTime(audio.duration);
    };

    // Autoplay after delay
    const t = setTimeout(() => play(), AUTOPLAY_DELAY_MS);

    return () => {
      clearTimeout(t);
      audio.pause();
      stopViz();
      audioCtxRef.current?.close();
    };
  }, []);

  const isPlaying = status === "playing";
  const hasStarted = status !== "idle" && status !== "blocked";

  return (
    <div style={{
      width: "100%", maxWidth: 520,
      background: "rgba(0,0,0,0.35)",
      border: "1px solid rgba(0,212,170,0.15)",
      borderRadius: 24,
      padding: "24px 24px 20px",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", gap: 16,
      boxShadow: isPlaying ? "0 0 60px rgba(0,212,170,0.12), 0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.3)",
      transition: "box-shadow 0.6s ease",
    }}>

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: "linear-gradient(135deg,#0A2030,#003D2E)",
          border: `1.5px solid rgba(0,212,170,${isPlaying ? "0.6" : "0.25"})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isPlaying ? "0 0 18px rgba(0,212,170,0.3)" : "none",
          transition: "border-color 0.4s, box-shadow 0.4s",
        }}>
          <span style={{
            fontSize: 22, fontWeight: 900, color: "#00D4AA",
            fontFamily: "system-ui,sans-serif",
            display: "inline-block",
            animation: isPlaying ? "cited-spin-burst 3.6s cubic-bezier(0.22,0,0.1,1) infinite" : "none",
          }}>✚</span>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: 0.5 }}>Cit</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
            {isPlaying ? "talking to you…" : status === "blocked" ? "tap to hear Cit" : status === "ended" ? "replay anytime" : "your research coach"}
          </div>
        </div>

        {/* Play/pause pill — right side */}
        <button onClick={toggle}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", padding: 0,
          }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: isPlaying ? "rgba(0,212,170,0.1)" : "rgba(0,212,170,0.15)",
            border: "1.5px solid rgba(0,212,170,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {isPlaying
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1.5" fill="#00D4AA"/><rect x="8" y="2" width="4" height="10" rx="1.5" fill="#00D4AA"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2L12 7L3 12V2Z" fill="#00D4AA"/></svg>
            }
          </div>
        </button>
      </div>

      {/* Canvas waveform */}
      <canvas ref={canvasRef} style={{ width: "100%", height: 52, display: "block" }} />

      {/* Scrubber */}
      <div>
        <div ref={scrubRef} onClick={handleScrub}
          style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 9999, cursor: "pointer", position: "relative" }}>
          <div ref={fillRef} style={{ height: "100%", width: "0%", background: "linear-gradient(90deg,#00D4AA,#00E5B5)", borderRadius: 9999 }} />
          <div ref={thumbRef} style={{
            position: "absolute", top: "50%", left: "0%", transform: "translate(-50%,-50%)",
            width: 11, height: 11, borderRadius: "50%",
            background: "#00D4AA", boxShadow: "0 0 6px rgba(0,212,170,0.7)",
            pointerEvents: "none",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span ref={timeRef} style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>00:00</span>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Blocked fallback message */}
      {status === "blocked" && (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(0,212,170,0.7)", textAlign: "center" }}>
          Tap play above to hear Cit introduce himself ↑
        </p>
      )}
    </div>
  );
}
