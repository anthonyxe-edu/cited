"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CitAvatar } from "@/components/ui/CitAvatar";
import { Slider, SliderThumb } from "@/components/ui/slider";

interface CITEDListenProps {
  text: string;
  query?: string;
  className?: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export function CITEDListen({ text, query = "", className }: CITEDListenProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const animRef      = useRef<number | null>(null);

  function startTick() {
    function tick() {
      const a = audioRef.current;
      if (a) setElapsed(a.currentTime);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
  }
  function stopTick() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }

  useEffect(() => () => {
    audioRef.current?.pause();
    stopTick();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

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
      stopTick();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audio.playbackRate = SPEEDS[speedIdx];
      audioRef.current = audio;

      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => {
        stopTick();
        setElapsed(audio.duration);
        setState("paused");
      };

      await audio.play();
      setState("playing");
      startTick();
    } catch {
      setState("error");
    }
  }, [text, query, speedIdx]);

  function handlePlayPause() {
    if (state === "idle" || state === "error") { fetchAndPlay(); return; }
    if (state === "playing") {
      audioRef.current?.pause();
      stopTick();
      setState("paused");
    } else if (state === "paused") {
      audioRef.current?.play().then(() => {
        startTick();
        setState("playing");
      });
    }
  }

  function handleSeek(value: number[]) {
    const t = value[0];
    if (audioRef.current) audioRef.current.currentTime = t;
    setElapsed(t);
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }

  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const hasAudio  = state !== "idle";

  return (
    <div className={cn("w-full", className)}>
      <div style={{
        background: "rgba(0,212,170,0.06)",
        border: "1px solid rgba(0,212,170,0.15)",
        borderRadius: 18,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>

        {/* Cit avatar */}
        <CitAvatar size={44} speaking={isPlaying} />

        {/* Middle: play + slider + time */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Play/pause button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "#00D4AA",
                border: "none",
                cursor: isLoading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.15s",
              }}
              onMouseDown={e => (e.currentTarget.style.transform = "scale(0.92)")}
              onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              {isLoading ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "citListenSpin 1s linear infinite" }}>
                  <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                  <path d="M7 2 A5 5 0 0 1 12 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : isPlaying ? (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <rect x="1" y="1" width="3.5" height="12" rx="1" fill="#0A1628" />
                  <rect x="7.5" y="1" width="3.5" height="12" rx="1" fill="#0A1628" />
                </svg>
              ) : (
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                  <path d="M2 1L11 7L2 13V1Z" fill="#0A1628" />
                </svg>
              )}
            </button>

            {/* Radix slider */}
            <div style={{ flex: 1 }}>
              <Slider
                value={[elapsed]}
                min={0}
                max={duration || 1}
                step={0.1}
                onValueChange={handleSeek}
                disabled={!hasAudio}
              >
                <SliderThumb />
              </Slider>
            </div>
          </div>

          {/* Time + speed */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 44 }}>
            <span style={{
              fontFamily: "monospace", fontSize: 11,
              color: "rgba(0,212,170,0.5)",
            }}>
              {hasAudio ? `${formatTime(elapsed)} / ${formatTime(duration)}` : "Tap play to listen"}
            </span>

            {hasAudio && (
              <button
                onClick={cycleSpeed}
                style={{
                  background: "rgba(0,212,170,0.1)",
                  border: "1px solid rgba(0,212,170,0.2)",
                  borderRadius: 6, padding: "2px 6px",
                  fontSize: 10, fontWeight: 700,
                  color: "#00D4AA",
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {SPEEDS[speedIdx]}x
              </button>
            )}
          </div>
        </div>

        {state === "error" && (
          <span style={{ fontSize: 11, color: "rgba(239,68,68,0.8)" }}>Error</span>
        )}
      </div>

      <style>{`
        @keyframes citListenSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
