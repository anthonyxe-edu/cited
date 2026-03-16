"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY_MS = 2200;
const BAR_COUNT = 64;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function drawBars(
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

  const cy   = H / 2;
  const barW = 3;
  const gap  = (W - BAR_COUNT * barW) / (BAR_COUNT + 1);

  // Idle flat line
  if (!data || !active) {
    for (let i = 0; i < BAR_COUNT; i++) {
      const x = gap + i * (barW + gap);
      const pos = i / (BAR_COUNT - 1);
      const env = Math.sin(pos * Math.PI);
      const h = 1.5 + env * 2;
      ctx.fillStyle = isDark ? "rgba(0,212,170,0.12)" : "rgba(0,100,80,0.15)";
      ctx.beginPath();
      ctx.roundRect(x, cy - h / 2, barW, h, 1);
      ctx.fill();
    }
    return;
  }

  for (let i = 0; i < BAR_COUNT; i++) {
    const sampleIdx = Math.floor((i / BAR_COUNT) * data.length);
    const raw = (data[sampleIdx] - 128) / 128;

    // Sharper envelope — peaks high in center, falls steeply at edges
    const pos = i / (BAR_COUNT - 1);
    const env = Math.pow(Math.sin(pos * Math.PI), 0.6);

    const amp  = Math.abs(raw) * env;
    const minH = 2;
    const maxH = (H / 2) * 0.96;
    const h    = minH + amp * (maxH - minH);

    const x = gap + i * (barW + gap);

    if (isDark) {
      // Dark mode: bright teal → warm white-teal at center
      const t = env;
      const r = Math.round(t * 100);
      const g = Math.round(185 + t * 70);
      const b = Math.round(170 + t * 85);
      const a = 0.35 + t * 0.65;
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    } else {
      // Light mode: deep teal → navy at center
      const t = env;
      const r = Math.round(0   + t * 10);
      const g = Math.round(80  + t * 60);
      const b = Math.round(100 + t * 80);
      const a = 0.45 + t * 0.55;
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    }

    // Up
    ctx.beginPath();
    ctx.roundRect(x, cy - h, barW, h, [barW / 2, barW / 2, 0, 0]);
    ctx.fill();
    // Down (mirror)
    ctx.beginPath();
    ctx.roundRect(x, cy, barW, h, [0, 0, barW / 2, barW / 2]);
    ctx.fill();

    // Glow on center peaks
    if (env > 0.55 && amp > 0.25) {
      ctx.shadowColor  = isDark ? "rgba(0,229,181,0.5)" : "rgba(0,120,100,0.35)";
      ctx.shadowBlur   = 10;
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
  const { isDark } = useTheme();
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
  const isDarkRef   = useRef(isDark);
  isDarkRef.current = isDark;

  function startViz() {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;
    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);
      if (canvasRef.current) drawBars(canvasRef.current, data, true, isDarkRef.current);
      const a = audioRef.current;
      if (a && a.duration > 0) {
        const pct = (a.currentTime / a.duration) * 100;
        if (fillRef.current)  fillRef.current.style.width = `${pct}%`;
        if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
        if (timeRef.current)  timeRef.current.textContent  = formatTime(a.currentTime);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  function stopViz() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (canvasRef.current) drawBars(canvasRef.current, null, false, isDarkRef.current);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const ctx      = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.78;
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
      if (fillRef.current)  fillRef.current.style.width = "100%";
      if (thumbRef.current) thumbRef.current.style.left = "100%";
      if (timeRef.current && audio.duration)
        timeRef.current.textContent = formatTime(audio.duration);
      onEnded?.();
    };

    const t = setTimeout(() => play(), AUTOPLAY_DELAY_MS);
    return () => { clearTimeout(t); audio.pause(); stopViz(); audioCtxRef.current?.close(); };
  }, []);

  // Redraw on theme change when idle
  useEffect(() => {
    if (status !== "playing" && canvasRef.current) {
      drawBars(canvasRef.current, null, false, isDark);
    }
  }, [isDark]);

  const isPlaying = status === "playing";

  const accentColor    = isDark ? "#00D4AA" : "#006B57";
  const labelColor     = isDark ? "rgba(255,255,255,0.85)" : "rgba(10,22,40,0.85)";
  const subColor       = isDark ? "rgba(255,255,255,0.35)" : "rgba(10,22,40,0.4)";
  const scrubTrack     = isDark ? "rgba(255,255,255,0.08)" : "rgba(10,22,40,0.1)";
  const scrubFill      = isDark
    ? "linear-gradient(90deg,#00D4AA,#00E5B5)"
    : "linear-gradient(90deg,#006B57,#009B80)";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Identity row — floating, no card */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 22, fontWeight: 900, color: accentColor,
            fontFamily: "system-ui,sans-serif",
            display: "inline-block",
            animation: isPlaying ? "cited-spin-burst 3.6s cubic-bezier(0.22,0,0.1,1) infinite" : "none",
          }}>✚</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: labelColor, letterSpacing: 0.5 }}>Cit</div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 1 }}>
              {isPlaying ? "talking to you…"
                : status === "blocked" ? "tap to hear Cit"
                : status === "ended"   ? "replay anytime"
                : "your research coach"}
            </div>
          </div>
        </div>

        {/* Minimal play/pause */}
        <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: isDark ? "rgba(0,212,170,0.1)" : "rgba(0,107,87,0.08)",
            border: `1.5px solid ${isDark ? "rgba(0,212,170,0.3)" : "rgba(0,107,87,0.25)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {isPlaying
              ? <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1.5" fill={accentColor}/><rect x="8" y="2" width="4" height="10" rx="1.5" fill={accentColor}/></svg>
              : <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 2L12 7L3 12V2Z" fill={accentColor}/></svg>
            }
          </div>
        </button>
      </div>

      {/* Waveform — no container, just the canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 120, display: "block" }}
      />

      {/* Minimal scrubber */}
      <div>
        <div ref={scrubRef} onClick={handleScrub}
          style={{ height: 2, background: scrubTrack, borderRadius: 9999, cursor: "pointer", position: "relative" }}>
          <div ref={fillRef} style={{
            height: "100%", width: "0%",
            background: scrubFill,
            borderRadius: 9999,
          }} />
          <div ref={thumbRef} style={{
            position: "absolute", top: "50%", left: "0%",
            transform: "translate(-50%,-50%)",
            width: 9, height: 9, borderRadius: "50%",
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}80`,
            pointerEvents: "none",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span ref={timeRef} style={{ fontFamily: "monospace", fontSize: 10, color: subColor }}>00:00</span>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: subColor, opacity: 0.6 }}>{formatTime(duration)}</span>
        </div>
      </div>

      {status === "blocked" && (
        <p style={{ margin: 0, fontSize: 12, color: accentColor, textAlign: "center", opacity: 0.8 }}>
          Tap play above to hear Cit ↑
        </p>
      )}
    </div>
  );
}
