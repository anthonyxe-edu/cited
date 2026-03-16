"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CITEDListenProps {
  text: string;
  query?: string;
  className?: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const CANVAS_H = 48;

function drawWave(canvas: HTMLCanvasElement, data: Uint8Array | null, active: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth;
  const H   = CANVAS_H;

  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }

  ctx.clearRect(0, 0, W, H);
  const cy = H / 2;

  if (!data || !active) {
    // Flat idle line
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 0;
    ctx.stroke();
    return;
  }

  // ── Build smooth bezier path through time-domain samples ────────────────────
  const amp      = H * 0.42; // max deviation each way from center
  const step     = W / (data.length - 1);

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128; // -1 … +1
    const x = i * step;
    const y = cy + v * amp;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const px = (i - 1) * step;
      const pv = (data[i - 1] - 128) / 128;
      const py = cy + pv * amp;
      ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    }
  }
  // Close to last point
  const lastV = (data[data.length - 1] - 128) / 128;
  ctx.lineTo(W, cy + lastV * amp);

  // ── Gradient: fades at both edges, bright in centre ─────────────────────────
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    "rgba(0,212,170,0)");
  grad.addColorStop(0.1,  "rgba(0,212,170,0.65)");
  grad.addColorStop(0.5,  "rgba(0,229,181,1)");
  grad.addColorStop(0.9,  "rgba(0,212,170,0.65)");
  grad.addColorStop(1,    "rgba(0,212,170,0)");

  ctx.strokeStyle = grad;
  ctx.lineWidth   = 2.2;
  ctx.lineJoin    = "round";
  ctx.lineCap     = "round";
  ctx.shadowColor = "#00D4AA";
  ctx.shadowBlur  = 10;
  ctx.stroke();

  // Second pass: thinner bright core for depth
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    const x = i * step;
    const y = cy + v * amp;
    if (i === 0) { ctx.moveTo(x, y); }
    else {
      const px = (i - 1) * step;
      const pv = (data[i - 1] - 128) / 128;
      const py = cy + pv * amp;
      ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    }
  }
  ctx.strokeStyle = "rgba(180,255,235,0.35)";
  ctx.lineWidth   = 1;
  ctx.shadowBlur  = 4;
  ctx.stroke();
}

export function CITEDListen({ text, query = "", className }: CITEDListenProps) {
  const [state, setState]       = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [duration, setDuration] = useState(0);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef    = useRef<string | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const animFrameRef    = useRef<number | null>(null);
  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const scrubberRef     = useRef<HTMLDivElement | null>(null);
  const fillRef         = useRef<HTMLDivElement | null>(null);
  const thumbRef        = useRef<HTMLDivElement | null>(null);
  const elapsedLabelRef = useRef<HTMLSpanElement | null>(null);

  // ── RAF loop: waveform + scrubber ───────────────────────────────────────────
  function startVisualizer() {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;

    function frame() {
      if (analyser && data) analyser.getByteTimeDomainData(data);
      if (canvasRef.current) drawWave(canvasRef.current, data, true);

      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        const pct = (audio.currentTime / audio.duration) * 100;
        if (fillRef.current)         fillRef.current.style.width         = `${pct}%`;
        if (thumbRef.current)        thumbRef.current.style.left         = `${pct}%`;
        if (elapsedLabelRef.current) elapsedLabelRef.current.textContent = formatTime(audio.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(frame);
    }
    animFrameRef.current = requestAnimationFrame(frame);
  }

  function stopVisualizer() {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (canvasRef.current) drawWave(canvasRef.current, null, false);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!audioRef.current || state === "idle" || state === "loading") return;
      if (e.key === "ArrowRight") { seek(Math.min(audioRef.current.currentTime + 5, audioRef.current.duration)); e.preventDefault(); }
      if (e.key === "ArrowLeft")  { seek(Math.max(audioRef.current.currentTime - 5, 0)); e.preventDefault(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  useEffect(() => () => {
    audioRef.current?.pause();
    stopVisualizer();
    audioCtxRef.current?.close();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function seek(time: number) {
    if (audioRef.current) audioRef.current.currentTime = time;
  }
  function skip(delta: number) {
    if (!audioRef.current) return;
    seek(Math.max(0, Math.min(audioRef.current.currentTime + delta, audioRef.current.duration)));
  }
  function handleScrubberClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!scrubberRef.current || !audioRef.current?.duration) return;
    const r = scrubberRef.current.getBoundingClientRect();
    seek(Math.max(0, Math.min((e.clientX - r.left) / r.width, 1)) * audioRef.current.duration);
  }

  // ── Fetch + play ─────────────────────────────────────────────────────────────
  const fetchAndPlay = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, query }),
      });
      if (!res.ok) throw new Error("API error");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);

      audioRef.current?.pause();
      stopVisualizer();
      audioCtxRef.current?.close();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      try {
        const ctx      = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.82;
        ctx.createMediaElementSource(audio).connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch { /* audio plays, no reactive waveform */ }

      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => {
        stopVisualizer();
        setState("paused");
        if (elapsedLabelRef.current) elapsedLabelRef.current.textContent = formatTime(audio.duration);
        if (fillRef.current)         fillRef.current.style.width  = "100%";
        if (thumbRef.current)        thumbRef.current.style.left  = "100%";
      };

      await audio.play();
      if (audioCtxRef.current?.state === "suspended") await audioCtxRef.current.resume();
      setState("playing");
      startVisualizer();
    } catch {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.92;
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(v => v.name.includes("Samantha")) || voices.find(v => v.lang.startsWith("en") && v.localService);
        if (v) utter.voice = v;
        utter.onend = () => setState("paused");
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
        setState("playing");
      } else {
        setState("error");
      }
    }
  }, [text, query]);

  function handlePlayPause() {
    if (state === "idle" || state === "error") { fetchAndPlay(); }
    else if (state === "playing") {
      audioRef.current?.pause();
      window.speechSynthesis?.pause();
      stopVisualizer();
      setState("paused");
    } else if (state === "paused") {
      audioRef.current?.play().then(() => {
        if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
        startVisualizer();
        setState("playing");
      });
      window.speechSynthesis?.resume();
    }
  }

  function handleClose() {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    stopVisualizer();
    setState("idle");
    setDuration(0);
    if (fillRef.current)         fillRef.current.style.width         = "0%";
    if (thumbRef.current)        thumbRef.current.style.left         = "0%";
    if (elapsedLabelRef.current) elapsedLabelRef.current.textContent = "00:00";
  }

  const isPlaying  = state === "playing";
  const isLoading  = state === "loading";
  const hasStarted = state !== "idle";

  return (
    <div className={cn("w-full", className)}>
      <div style={{
        background: "linear-gradient(135deg,#0A1628,#0D2040)",
        borderRadius: 20, padding: "20px 18px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        position: "relative",
      }}>

        {/* Close */}
        {hasStarted && (
          <button onClick={handleClose} style={{
            position: "absolute", top: 12, right: 14,
            background: "rgba(255,255,255,0.08)", border: "none",
            borderRadius: 8, padding: "4px 6px", cursor: "pointer",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Label */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 2 }}>Dr. CITED</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
            {isLoading ? "Generating your summary…" : isPlaying ? "Your coach is talking…" : hasStarted ? "Paused — tap to resume" : "Tap to hear your results"}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <button onClick={() => skip(-5)} disabled={!hasStarted || isLoading}
            style={{ background: "none", border: "none", cursor: hasStarted && !isLoading ? "pointer" : "default", padding: 0, opacity: hasStarted && !isLoading ? 1 : 0.2, transition: "opacity 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V1L6 5l4 4V7c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5H3c0 3.87 3.13 7 7 7s7-3.13 7-7-3.13-7-7-7z" fill="rgba(255,255,255,0.65)"/>
            </svg>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>5s</span>
          </button>

          {/* Main button */}
          <button onClick={handlePlayPause} disabled={isLoading}
            style={{
              width: 64, height: 64, borderRadius: 18, cursor: isLoading ? "wait" : "pointer",
              background: "rgba(0,212,170,0.10)", border: "1.5px solid rgba(0,212,170,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
            <div style={{ position: "absolute", opacity: isLoading ? 1 : 0, transition: "opacity 0.2s", pointerEvents: "none" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: "cited-listen-spin 1s linear infinite" }}>
                <circle cx="14" cy="14" r="10" stroke="rgba(0,212,170,0.18)" strokeWidth="2.5"/>
                <path d="M14 4 A10 10 0 0 1 24 14" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{
              position: "absolute", fontSize: 30, fontWeight: 900, color: "#00D4AA", fontFamily: "system-ui,sans-serif",
              opacity: isPlaying ? 1 : 0, transform: isPlaying ? "scale(1)" : "scale(0.5)",
              transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
              animation: isPlaying ? "cited-spin-burst 3.6s cubic-bezier(0.22,0,0.1,1) infinite" : "none",
              pointerEvents: "none",
            }}>✚</span>
            <div style={{
              position: "absolute",
              opacity: !isPlaying && !isLoading ? 1 : 0, transform: !isPlaying && !isLoading ? "scale(1)" : "scale(0.5)",
              transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)",
              pointerEvents: "none",
            }}>
              {hasStarted
                ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M7 4.5L18 11L7 17.5V4.5Z" fill="#00D4AA"/></svg>
                : <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#00D4AA" strokeWidth="1.5"/><path d="M9 7.5L15 11L9 14.5V7.5Z" fill="#00D4AA"/></svg>
              }
            </div>
          </button>

          <button onClick={() => skip(5)} disabled={!hasStarted || isLoading}
            style={{ background: "none", border: "none", cursor: hasStarted && !isLoading ? "pointer" : "default", padding: 0, opacity: hasStarted && !isLoading ? 1 : 0.2, transition: "opacity 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V1l4 4-4 4V7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5h2c0 3.87-3.13 7-7 7S3 14.87 3 11s3.13-7 7-7z" fill="rgba(255,255,255,0.65)"/>
            </svg>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>5s</span>
          </button>
        </div>

        {/* Scrubber */}
        {hasStarted && (
          <div style={{ width: "100%", maxWidth: 290 }}>
            <div ref={scrubberRef} onClick={handleScrubberClick}
              style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 9999, cursor: "pointer", position: "relative" }}>
              <div ref={fillRef} style={{ height: "100%", width: "0%", background: "linear-gradient(90deg,#00D4AA,#00E5B5)", borderRadius: 9999 }} />
              <div ref={thumbRef} style={{
                position: "absolute", top: "50%", left: "0%", transform: "translate(-50%,-50%)",
                width: 13, height: 13, borderRadius: "50%",
                background: "#00D4AA", boxShadow: "0 0 7px rgba(0,212,170,0.7)",
                pointerEvents: "none",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span ref={elapsedLabelRef} style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>00:00</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.22)" }}>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Canvas waveform — free-flowing, center-origin, edge-faded */}
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: 290, height: CANVAS_H, display: "block" }}
        />

        {state === "error" && (
          <p style={{ fontSize: 12, color: "rgba(255,107,107,0.8)", margin: 0 }}>Couldn't generate audio — tap to retry.</p>
        )}
        {!hasStarted && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>← → keys to skip 5s · click bar to seek</p>
        )}
      </div>
      <style>{`@keyframes cited-listen-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
