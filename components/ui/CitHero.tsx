"use client";

import { useEffect, useRef, useState } from "react";
import { SparklesCore } from "@/components/ui/sparkles";

const AUDIO_SRC = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY_MS = 2200;
const BAR_COUNT = 60;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function drawBars(canvas: HTMLCanvasElement, data: Uint8Array | null, active: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }
  ctx.clearRect(0, 0, W, H);

  const cy = H / 2;
  const barW = 2.5;
  const gap = (W - BAR_COUNT * barW) / (BAR_COUNT + 1);

  if (!data || !active) {
    // Idle: flat tiny bars
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = gap + i * (barW + gap);
      const h = 2;
      ctx.fillStyle = "rgba(0,212,170,0.15)";
      ctx.beginPath();
      ctx.roundRect(x, cy - h / 2, barW, h, 1);
      ctx.fill();
    }
    return;
  }

  // Sample the time-domain data evenly across BAR_COUNT bars
  for (let i = 0; i < BAR_COUNT; i++) {
    const sampleIdx = Math.floor((i / BAR_COUNT) * data.length);
    const raw = (data[sampleIdx] - 128) / 128; // -1 to 1

    // Envelope: bars taller in center, shorter at edges (like the reference image)
    const pos = i / (BAR_COUNT - 1); // 0 to 1
    const envelope = Math.sin(pos * Math.PI); // peaks at center
    const amp = Math.abs(raw) * envelope;
    const minH = 2;
    const maxH = (H / 2) * 0.92;
    const h = minH + amp * (maxH - minH);

    const x = gap + i * (barW + gap);

    // Color gradient: edges teal, center bright white-teal
    const t = envelope; // 0 at edges, 1 at center
    const r = Math.round(0   + t * 80);
    const g = Math.round(180 + t * 75);
    const b = Math.round(170 + t * 85);
    const alpha = 0.4 + t * 0.6;

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

    // Draw bar upward
    ctx.beginPath();
    ctx.roundRect(x, cy - h, barW, h, [barW / 2, barW / 2, 0, 0]);
    ctx.fill();

    // Draw bar downward (mirror)
    ctx.beginPath();
    ctx.roundRect(x, cy, barW, h, [0, 0, barW / 2, barW / 2]);
    ctx.fill();

    // Glow on tall bars
    if (t > 0.5 && amp > 0.3) {
      ctx.shadowColor = `rgba(0,229,181,${alpha * 0.8})`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.4})`;
      ctx.beginPath();
      ctx.roundRect(x, cy - h, barW, h * 2, barW / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

interface CitHeroProps {
  onEnded?: () => void;
}

export function CitHero({ onEnded }: CitHeroProps) {
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "ended" | "blocked">("idle");
  const [duration, setDuration] = useState(0);

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef   = useRef<HTMLCanvasElement | null>(null);
  const fillRef     = useRef<HTMLDivElement | null>(null);
  const thumbRef    = useRef<HTMLDivElement | null>(null);
  const timeRef     = useRef<HTMLSpanElement | null>(null);
  const animRef     = useRef<number | null>(null);
  const scrubRef    = useRef<HTMLDivElement | null>(null);

  function startViz() {
    const analyser = analyserRef.current;
    const data = analyser ? new Uint8Array(analyser.fftSize) : null;
    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);
      if (canvasRef.current) drawBars(canvasRef.current, data, true);
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
    if (canvasRef.current) drawBars(canvasRef.current, null, false);
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

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  function handleScrub(e: React.MouseEvent<HTMLDivElement>) {
    const a  = audioRef.current;
    const el = scrubRef.current;
    if (!a || !el || !a.duration) return;
    const r = el.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min((e.clientX - r.left) / r.width, 1)) * a.duration;
  }

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
      onEnded?.();
    };

    const t = setTimeout(() => play(), AUTOPLAY_DELAY_MS);

    return () => {
      clearTimeout(t);
      audio.pause();
      stopViz();
      audioCtxRef.current?.close();
    };
  }, []);

  const isPlaying = status === "playing";

  return (
    <div style={{
      width: "100%", maxWidth: 540,
      position: "relative",
      borderRadius: 28,
      overflow: "hidden",
      background: "rgba(0,0,0,0.5)",
      border: `1px solid rgba(0,212,170,${isPlaying ? "0.3" : "0.1"})`,
      boxShadow: isPlaying
        ? "0 0 80px rgba(0,212,170,0.15), 0 0 30px rgba(0,212,170,0.08), 0 16px 48px rgba(0,0,0,0.5)"
        : "0 8px 32px rgba(0,0,0,0.4)",
      transition: "box-shadow 0.8s ease, border-color 0.8s ease",
    }}>

      {/* Sparkles background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={1.2}
          particleDensity={isPlaying ? 60 : 20}
          particleColor="#00D4AA"
          speed={isPlaying ? 1.5 : 0.4}
          className="w-full h-full"
        />
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "22px 22px 18px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
            background: "linear-gradient(135deg,#061018,#002A1F)",
            border: `1.5px solid rgba(0,212,170,${isPlaying ? "0.7" : "0.25"})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: isPlaying ? "0 0 20px rgba(0,212,170,0.4)" : "none",
            transition: "border-color 0.4s, box-shadow 0.4s",
          }}>
            <span style={{
              fontSize: 20, fontWeight: 900, color: "#00D4AA",
              fontFamily: "system-ui,sans-serif",
              display: "inline-block",
              animation: isPlaying ? "cited-spin-burst 3.6s cubic-bezier(0.22,0,0.1,1) infinite" : "none",
            }}>✚</span>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white", letterSpacing: 0.4 }}>Cit</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              {isPlaying ? "talking to you…" : status === "blocked" ? "tap to hear Cit" : status === "ended" ? "replay anytime" : "your research coach"}
            </div>
          </div>

          {/* Play/pause */}
          <button onClick={toggle} style={{
            marginLeft: "auto", background: "none", border: "none",
            cursor: "pointer", padding: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: isPlaying ? "rgba(0,212,170,0.12)" : "rgba(0,212,170,0.18)",
              border: "1.5px solid rgba(0,212,170,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              boxShadow: isPlaying ? "0 0 12px rgba(0,212,170,0.3)" : "none",
            }}>
              {isPlaying
                ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1.5" fill="#00D4AA"/><rect x="8" y="2" width="4" height="10" rx="1.5" fill="#00D4AA"/></svg>
                : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2L12 7L3 12V2Z" fill="#00D4AA"/></svg>
              }
            </div>
          </button>
        </div>

        {/* Bar waveform canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: 64, display: "block" }}
        />

        {/* Scrubber */}
        <div>
          <div ref={scrubRef} onClick={handleScrub}
            style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 9999, cursor: "pointer", position: "relative" }}>
            <div ref={fillRef} style={{
              height: "100%", width: "0%",
              background: "linear-gradient(90deg,#00D4AA,#00E5B5)",
              borderRadius: 9999,
            }} />
            <div ref={thumbRef} style={{
              position: "absolute", top: "50%", left: "0%",
              transform: "translate(-50%,-50%)",
              width: 10, height: 10, borderRadius: "50%",
              background: "#00D4AA",
              boxShadow: "0 0 8px rgba(0,212,170,0.8)",
              pointerEvents: "none",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span ref={timeRef} style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>00:00</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.18)" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {status === "blocked" && (
          <p style={{ margin: 0, fontSize: 12, color: "rgba(0,212,170,0.7)", textAlign: "center" }}>
            Tap play above to hear Cit introduce himself ↑
          </p>
        )}
      </div>
    </div>
  );
}
