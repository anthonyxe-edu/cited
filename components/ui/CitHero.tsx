"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC      = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY = 2200;
const CHIME_DELAY    = 400;

/* ── test if audio is likely allowed ───────────────────────────────────────── */
function canAutoplay(): boolean {
  try {
    const ctx = new AudioContext();
    const allowed = ctx.state === "running";
    ctx.close();
    return allowed;
  } catch {
    return false;
  }
}

/* ── sparkle chime via Web Audio API ────────────────────────────────────────── */
function playChime(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = new AudioContext();
    ref.current = ctx;
    const now = ctx.currentTime;

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

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.value = 6000;
    g2.gain.setValueAtTime(0.025, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o2.connect(g2).connect(ctx.destination);
    o2.start(now);
    o2.stop(now + 0.25);

    const o3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    o3.type = "sine";
    o3.frequency.value = 1200;
    g3.gain.setValueAtTime(0.04, now + 0.05);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o3.connect(g3).connect(ctx.destination);
    o3.start(now + 0.05);
    o3.stop(now + 0.6);
  } catch { /* best-effort */ }
}

/* ── Cit 3D-style clay mascot ──────────────────────────────────────────────── */
function CitCharacter({
  mouthOpen,
  size = 260,
}: {
  mouthOpen: number; // 0–1
  size?: number;
}) {
  // Moss green palette
  const BASE     = "#4B7D50";
  const LIGHT    = "#5A9460";
  const SHADOW   = "#3D6842";
  const DEEP     = "#2F5233";
  const DISC     = "#A0A0A0";
  const DISC_LT  = "#B8B8B8";

  // Mouth: small dark opening, grows when speaking
  const mouthRx = 3.5 + mouthOpen * 1.5;
  const mouthRy = 1.5 + mouthOpen * 3;

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 200 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* Body gradient — subtle 3D shading */}
        <linearGradient id="citBodyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="45%" stopColor={BASE} />
          <stop offset="100%" stopColor={SHADOW} />
        </linearGradient>
        {/* Cross head gradient */}
        <linearGradient id="citHeadGrad" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="40%" stopColor={BASE} />
          <stop offset="100%" stopColor={SHADOW} />
        </linearGradient>
        {/* Arm gradient */}
        <linearGradient id="citArmGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="100%" stopColor={SHADOW} />
        </linearGradient>
        {/* Disc gradient */}
        <radialGradient id="citDiscGrad" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor={DISC_LT} />
          <stop offset="100%" stopColor={DISC} />
        </radialGradient>
        {/* Soft shadow */}
        <filter id="citShadow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="citBaseShadow">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ── Grey disc base ── */}
      <ellipse cx="100" cy="215" rx="42" ry="10" fill="rgba(0,0,0,0.08)" filter="url(#citBaseShadow)" />
      <ellipse cx="100" cy="212" rx="38" ry="9" fill="url(#citDiscGrad)" />
      {/* Disc highlight */}
      <ellipse cx="100" cy="210" rx="28" ry="5" fill="rgba(255,255,255,0.12)" />

      {/* ── Legs ── */}
      {/* Left leg */}
      <rect x="82" y="175" width="14" height="34" rx="7" fill="url(#citBodyGrad)" />
      {/* Right leg */}
      <rect x="104" y="175" width="14" height="34" rx="7" fill="url(#citBodyGrad)" />
      {/* Feet — rounded nubs */}
      <ellipse cx="89" cy="207" rx="9" ry="5.5" fill={BASE} />
      <ellipse cx="111" cy="207" rx="9" ry="5.5" fill={BASE} />

      {/* ── Body / Torso ── */}
      {/* Torso shadow */}
      <ellipse cx="101" cy="170" rx="18" ry="6" fill="rgba(0,0,0,0.06)" filter="url(#citShadow)" />
      {/* Main torso — slender, rounded */}
      <rect x="80" y="120" width="40" height="58" rx="16" fill="url(#citBodyGrad)" />
      {/* Torso highlight (subtle 3D depth) */}
      <rect x="86" y="125" width="16" height="35" rx="8" fill="rgba(255,255,255,0.06)" />

      {/* ── Left arm (viewer's left = character's right) — WAVING ── */}
      {/* Upper arm — angled up */}
      <rect x="52" y="108" width="12" height="30" rx="6"
        fill="url(#citArmGrad)"
        transform="rotate(-35 58 123)" />
      {/* Forearm — angled further up for wave */}
      <rect x="42" y="82" width="11" height="28" rx="5.5"
        fill="url(#citArmGrad)"
        transform="rotate(15 47 96)" />
      {/* Hand — open, waving */}
      <ellipse cx="52" cy="78" rx="7" ry="8" fill={BASE}
        transform="rotate(10 52 78)" />
      {/* Fingers hint */}
      <ellipse cx="48" cy="72" rx="2.5" ry="4" fill={LIGHT} transform="rotate(-10 48 72)" />
      <ellipse cx="53" cy="70" rx="2.5" ry="4.5" fill={LIGHT} transform="rotate(0 53 70)" />
      <ellipse cx="58" cy="72" rx="2.5" ry="4" fill={LIGHT} transform="rotate(10 58 72)" />

      {/* ── Right arm (viewer's right) — relaxed at side ── */}
      {/* Upper arm */}
      <rect x="118" y="128" width="12" height="30" rx="6"
        fill="url(#citArmGrad)"
        transform="rotate(8 124 143)" />
      {/* Forearm */}
      <rect x="120" y="155" width="11" height="26" rx="5.5"
        fill="url(#citArmGrad)"
        transform="rotate(5 125 168)" />
      {/* Hand — relaxed fist */}
      <ellipse cx="127" cy="182" rx="6.5" ry="7" fill={BASE} />

      {/* ── Neck ── */}
      <rect x="92" y="108" width="16" height="16" rx="8" fill={BASE} />

      {/* ── Cross Head ── */}
      {/* Shadow under head */}
      <ellipse cx="100" cy="112" rx="22" ry="4" fill="rgba(0,0,0,0.06)" filter="url(#citShadow)" />

      {/* Vertical bar of cross */}
      <rect x="82" y="28" width="36" height="86" rx="12" fill="url(#citHeadGrad)" />
      {/* Horizontal bar of cross */}
      <rect x="56" y="48" width="88" height="36" rx="12" fill="url(#citHeadGrad)" />

      {/* Cross head highlight — top-left light catch */}
      <rect x="87" y="33" width="14" height="30" rx="7" fill="rgba(255,255,255,0.08)" />
      <rect x="62" y="53" width="30" height="14" rx="7" fill="rgba(255,255,255,0.06)" />

      {/* Cross head depth — bottom-right shadow */}
      <rect x="96" y="85" width="18" height="24" rx="9" fill="rgba(0,0,0,0.04)" />
      <rect x="115" y="60" width="24" height="18" rx="9" fill="rgba(0,0,0,0.04)" />

      {/* ── Mouth — small, dark, centered on lower cross segment ── */}
      <ellipse
        cx="100"
        cy="98"
        rx={mouthRx}
        ry={mouthRy}
        fill="#3A2A20"
        stroke={DEEP}
        strokeWidth="0.8"
      />
      {/* Mouth interior highlight — subtle lip sheen */}
      {mouthOpen > 0.3 && (
        <ellipse
          cx="100"
          cy={97 + mouthOpen}
          rx={mouthRx * 0.5}
          ry={mouthRy * 0.35}
          fill="#5A3A2A"
        />
      )}
    </svg>
  );
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
  const [visible, setVisible] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const analyserRef    = useRef<AnalyserNode | null>(null);
  const animRef        = useRef<number | null>(null);
  const chimeCtxRef    = useRef<AudioContext | null>(null);
  const interactionCleanupRef = useRef<(() => void) | null>(null);

  /* ---- mouth animation loop (synced to audio amplitude) ---- */
  const startMouthSync = useCallback(() => {
    const analyser = analyserRef.current;
    const data     = analyser ? new Uint8Array(analyser.fftSize) : null;

    function frame() {
      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(
          data.reduce((s, v) => s + Math.pow((v - 128) / 128, 2), 0) / data.length,
        );
        setMouthOpen((prev) => prev * 0.45 + Math.min(rms * 18, 1) * 0.55);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }, []);

  function stopMouthSync() {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setMouthOpen(0);
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
        analyser.smoothingTimeConstant = 0.85;
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
      startMouthSync();
    } catch {
      setStatus("blocked");
    }
  }

  function pause() {
    audioRef.current?.pause();
    stopMouthSync();
    setStatus("paused");
  }

  /* ---- register listeners for first user interaction ---- */
  function waitForInteraction() {
    setStatus("blocked");
    setVisible(true);

    function onInteraction() {
      cleanup();
      playChime(chimeCtxRef);
      play();
    }
    function cleanup() {
      document.removeEventListener("click", onInteraction);
      document.removeEventListener("touchstart", onInteraction);
      document.removeEventListener("keydown", onInteraction);
      interactionCleanupRef.current = null;
    }
    document.addEventListener("click", onInteraction, { once: true });
    document.addEventListener("touchstart", onInteraction, { once: true });
    document.addEventListener("keydown", onInteraction, { once: true });
    interactionCleanupRef.current = cleanup;
  }

  /* ---- lifecycle ---- */
  useEffect(() => {
    const audio      = new Audio(AUDIO_SRC);
    audio.preload    = "auto";
    audioRef.current = audio;
    audio.onended    = () => {
      stopMouthSync();
      setStatus("ended");
      onEnded?.();
    };

    const allowed = canAutoplay();

    if (allowed) {
      const chimeT = setTimeout(() => {
        playChime(chimeCtxRef);
        setVisible(true);
      }, CHIME_DELAY);

      const playT = setTimeout(() => play(), AUTOPLAY_DELAY);

      return () => {
        clearTimeout(chimeT);
        clearTimeout(playT);
        audio.pause();
        stopMouthSync();
        audioCtxRef.current?.close();
        chimeCtxRef.current?.close();
        interactionCleanupRef.current?.();
      };
    } else {
      waitForInteraction();

      return () => {
        audio.pause();
        stopMouthSync();
        audioCtxRef.current?.close();
        chimeCtxRef.current?.close();
        interactionCleanupRef.current?.();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() {
    if (status === "playing") pause();
    else play();
  }

  return (
    <div
      onClick={toggle}
      style={{
        position: "relative",
        width: "100%",
        height: 340,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {/* ── Cit character with fade-in ── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.85)",
          transition: "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: visible && status !== "blocked" ? "citFloat 3.5s ease-in-out infinite" : "none",
        }}
      >
        <CitCharacter
          mouthOpen={mouthOpen}
          size={260}
        />
      </div>

      {/* ── Blocked hint ── */}
      {status === "blocked" && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: isDark ? "rgba(0,212,170,0.5)" : "rgba(0,107,87,0.45)",
            fontFamily: "system-ui, sans-serif",
            animation: "citPulse 2s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          tap to listen
        </div>
      )}

      <style>{`
        @keyframes citPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes citFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}
