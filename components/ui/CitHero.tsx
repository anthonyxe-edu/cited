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

/* ── Cit SVG character ─────────────────────────────────────────────────────── */
function CitCharacter({
  mouthOpen,
  isDark,
  size = 220,
}: {
  mouthOpen: number; // 0–1
  isDark: boolean;
  size?: number;
}) {
  const bodyColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(10,22,40,0.75)";
  const jointColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(10,22,40,0.4)";
  const mouthColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(10,22,40,0.8)";
  const glowColor  = isDark ? "rgba(0,212,170,0.25)" : "rgba(0,180,140,0.2)";

  // Mouth: curved line that opens into an ellipse when speaking
  const mouthY = 68;
  const mouthWidth = 6;
  const mouthHeight = mouthOpen * 4; // 0 when closed, 4 when fully open

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="citCrossGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5B5" />
          <stop offset="100%" stopColor="#00B894" />
        </linearGradient>
        <filter id="citGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="citSoftGlow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Ambient glow behind head ── */}
      <circle cx="50" cy="50" r="30" fill={glowColor} filter="url(#citSoftGlow)" />

      {/* ── Cross head (oversized — the CITED + mark) ── */}
      <g filter="url(#citGlow)">
        {/* Vertical bar */}
        <rect x="41" y="24" width="18" height="52" rx="6" fill="url(#citCrossGrad)" />
        {/* Horizontal bar */}
        <rect x="24" y="41" width="52" height="18" rx="6" fill="url(#citCrossGrad)" />
      </g>

      {/* ── Mouth (on the cross, lower center) ── */}
      {mouthHeight < 0.5 ? (
        // Closed: small curved smile line
        <path
          d={`M ${50 - mouthWidth} ${mouthY} Q 50 ${mouthY + 2} ${50 + mouthWidth} ${mouthY}`}
          stroke={mouthColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        // Open: ellipse mouth
        <ellipse
          cx="50"
          cy={mouthY}
          rx={mouthWidth * 0.8}
          ry={mouthHeight}
          fill={isDark ? "rgba(10,22,40,0.7)" : "rgba(255,255,255,0.8)"}
          stroke={mouthColor}
          strokeWidth="1"
        />
      )}

      {/* ── Neck ── */}
      <line x1="50" y1="76" x2="50" y2="84" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Torso ── */}
      <line x1="50" y1="84" x2="50" y2="110" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Arms ── */}
      {/* Left arm */}
      <line x1="50" y1="89" x2="36" y2="96" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="96" x2="30" y2="105" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="96" r="1.5" fill={jointColor} />

      {/* Right arm */}
      <line x1="50" y1="89" x2="64" y2="96" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="96" x2="70" y2="105" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="64" cy="96" r="1.5" fill={jointColor} />

      {/* ── Legs ── */}
      {/* Left leg */}
      <line x1="50" y1="110" x2="40" y2="126" stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="40" y1="126" x2="37" y2="138" stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="40" cy="126" r="1.5" fill={jointColor} />

      {/* Right leg */}
      <line x1="50" y1="110" x2="60" y2="126" stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="60" y1="126" x2="63" y2="138" stroke={bodyColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="60" cy="126" r="1.5" fill={jointColor} />

      {/* ── Joint circles ── */}
      <circle cx="50" cy="84" r="2" fill={jointColor} /> {/* shoulder */}
      <circle cx="50" cy="110" r="2" fill={jointColor} /> {/* hip */}
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
        // Map RMS to mouth openness (0–1), with smoothing
        setMouthOpen((prev) => prev * 0.5 + Math.min(rms * 16, 1) * 0.5);
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
    setVisible(true); // Show Cit immediately, waiting for tap

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
      // Chime + fade in Cit
      const chimeT = setTimeout(() => {
        playChime(chimeCtxRef);
        setVisible(true);
      }, CHIME_DELAY);

      // Start speech
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
        height: 300,
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
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
          transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: visible && status !== "blocked" ? "citFloat 3s ease-in-out infinite" : "none",
        }}
      >
        <CitCharacter
          mouthOpen={mouthOpen}
          isDark={isDark}
          size={220}
        />
      </div>

      {/* ── Blocked hint ── */}
      {status === "blocked" && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
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
