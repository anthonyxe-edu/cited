"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/lib/theme";

const AUDIO_SRC      = "/audio/cit-intro.mp3";
const AUTOPLAY_DELAY = 2200;
const CHIME_DELAY    = 400;

function canAutoplay(): boolean {
  try {
    const ctx = new AudioContext();
    const allowed = ctx.state === "running";
    ctx.close();
    return allowed;
  } catch { return false; }
}

function playChime(ref: React.MutableRefObject<AudioContext | null>) {
  try {
    const ctx = new AudioContext();
    ref.current = ctx;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator(); const g1 = ctx.createGain();
    o1.type = "triangle";
    o1.frequency.setValueAtTime(4200, now);
    o1.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
    o1.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
    g1.gain.setValueAtTime(0.07, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    o1.connect(g1).connect(ctx.destination); o1.start(now); o1.stop(now + 0.5);
    const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
    o2.type = "sine"; o2.frequency.value = 6000;
    g2.gain.setValueAtTime(0.025, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o2.connect(g2).connect(ctx.destination); o2.start(now); o2.stop(now + 0.25);
    const o3 = ctx.createOscillator(); const g3 = ctx.createGain();
    o3.type = "sine"; o3.frequency.value = 1200;
    g3.gain.setValueAtTime(0.04, now + 0.05);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o3.connect(g3).connect(ctx.destination); o3.start(now + 0.05); o3.stop(now + 0.6);
  } catch { /* best-effort */ }
}

/* ── Cit cross head with expressive mouth ──────────────────────────────────── */
function CitHead({ mouthOpen, mouthShape, size = 200 }: {
  mouthOpen: number; // 0–1
  mouthShape: number; // 0–1 drives shape variation (wide vs tall, smile vs O)
  size?: number;
}) {
  const BASE   = "#4B7D50";
  const LIGHT  = "#5A9460";
  const SHADOW = "#3D6842";
  const DEEP   = "#2F5233";

  // Expressive mouth — blends between shapes based on amplitude + shape
  // Wide smile (low amplitude), round O (high amplitude), asymmetric shapes in between
  const baseRx = 4;
  const baseRy = 1.8;
  const openRx = baseRx + mouthOpen * 2.5 - mouthShape * mouthOpen * 1.5;
  const openRy = baseRy + mouthOpen * 5 * (0.5 + mouthShape * 0.5);

  // Smile curve: when mostly closed, show a curved smile. When open, round mouth.
  const smileCurve = Math.max(0, 1 - mouthOpen * 3); // 1 when closed, 0 when open
  const mouthCy = 72;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="cG" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="40%" stopColor={BASE} />
          <stop offset="100%" stopColor={SHADOW} />
        </linearGradient>
        <filter id="cGlow">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cSoft"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>

      {/* Ambient glow */}
      <circle cx="70" cy="70" r="50" fill="rgba(75,125,80,0.08)" filter="url(#cGlow)" />

      {/* ── Cross head ── */}
      {/* Vertical bar */}
      <rect x="52" y="10" width="36" height="100" rx="14" fill="url(#cG)" />
      {/* Horizontal bar */}
      <rect x="18" y="38" width="104" height="44" rx="14" fill="url(#cG)" />

      {/* Highlights — top-left light catch */}
      <rect x="57" y="15" width="14" height="32" rx="7" fill="rgba(255,255,255,0.09)" />
      <rect x="24" y="43" width="32" height="16" rx="8" fill="rgba(255,255,255,0.06)" />

      {/* Depth shadows — bottom-right */}
      <rect x="68" y="80" width="16" height="24" rx="8" fill="rgba(0,0,0,0.04)" />
      <rect x="96" y="50" width="22" height="22" rx="10" fill="rgba(0,0,0,0.04)" />

      {/* ── Expressive mouth ── */}
      {smileCurve > 0.5 ? (
        /* Closed / resting — gentle smile curve */
        <path
          d={`M ${70 - 5} ${mouthCy - 0.5}
              Q 70 ${mouthCy + 2.5 + smileCurve * 1.5} ${70 + 5} ${mouthCy - 0.5}`}
          stroke="#3A2A20"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      ) : mouthOpen < 0.15 ? (
        /* Nearly closed — thin line, slight curve */
        <path
          d={`M ${70 - 4.5} ${mouthCy}
              Q 70 ${mouthCy + 1.5} ${70 + 4.5} ${mouthCy}`}
          stroke="#3A2A20"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        /* Open — organic blob shape, not a perfect ellipse */
        <g>
          <path
            d={`M ${70 - openRx} ${mouthCy}
                C ${70 - openRx} ${mouthCy - openRy * 0.8},
                  ${70 + openRx} ${mouthCy - openRy * 0.6},
                  ${70 + openRx} ${mouthCy}
                C ${70 + openRx} ${mouthCy + openRy},
                  ${70 - openRx} ${mouthCy + openRy * 1.1},
                  ${70 - openRx} ${mouthCy}
                Z`}
            fill="#3A2A20"
            stroke={DEEP}
            strokeWidth="0.6"
          />
          {/* Tongue / inner highlight when wide open */}
          {mouthOpen > 0.4 && (
            <ellipse
              cx={70}
              cy={mouthCy + openRy * 0.3}
              rx={openRx * 0.45}
              ry={openRy * 0.25}
              fill="#6B4A3A"
            />
          )}
          {/* Top lip shadow */}
          <path
            d={`M ${70 - openRx + 1} ${mouthCy}
                Q 70 ${mouthCy - openRy * 0.4} ${70 + openRx - 1} ${mouthCy}`}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}

/* ── component ──────────────────────────────────────────────────────────────── */
interface CitHeroProps { onEnded?: () => void; }

export function CitHero({ onEnded }: CitHeroProps) {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<"idle"|"playing"|"paused"|"ended"|"blocked">("idle");
  const [visible, setVisible] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [mouthShape, setMouthShape] = useState(0);
  const [introSpin, setIntroSpin] = useState(false);

  const audioRef    = useRef<HTMLAudioElement|null>(null);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const animRef     = useRef<number|null>(null);
  const chimeCtxRef = useRef<AudioContext|null>(null);
  const interactionCleanupRef = useRef<(()=>void)|null>(null);

  const startMouthSync = useCallback(() => {
    const analyser = analyserRef.current;
    const data = analyser ? new Uint8Array(analyser.fftSize) : null;
    let t = 0;
    function frame() {
      t += 0.016;
      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s,v) => s + Math.pow((v-128)/128,2), 0) / data.length);
        const target = Math.min(rms * 18, 1);
        setMouthOpen(prev => prev * 0.4 + target * 0.6);
        // Shape oscillates independently — creates variety in mouth shapes
        setMouthShape(Math.abs(Math.sin(t * 3.7)) * 0.6 + Math.abs(Math.sin(t * 1.9)) * 0.4);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }, []);

  function stopMouthSync() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setMouthOpen(0); setMouthShape(0);
  }

  async function play() {
    const audio = audioRef.current; if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.82;
        ctx.createMediaElementSource(audio).connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx; analyserRef.current = analyser;
      }
      if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
      await audio.play();
      setStatus("playing"); startMouthSync();
    } catch { setStatus("blocked"); }
  }

  function pause() { audioRef.current?.pause(); stopMouthSync(); setStatus("paused"); }

  function waitForInteraction() {
    setStatus("blocked"); setVisible(true);
    function onInteraction() { cleanup(); triggerIntro(); }
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

  function triggerIntro() {
    playChime(chimeCtxRef);
    setIntroSpin(true);
    setTimeout(() => { setIntroSpin(false); play(); }, 900);
  }

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC); audio.preload = "auto"; audioRef.current = audio;
    audio.onended = () => { stopMouthSync(); setStatus("ended"); onEnded?.(); };
    const allowed = canAutoplay();
    if (allowed) {
      const chimeT = setTimeout(() => {
        setVisible(true);
        triggerIntro();
      }, CHIME_DELAY);
      return () => { clearTimeout(chimeT); audio.pause(); stopMouthSync(); audioCtxRef.current?.close(); chimeCtxRef.current?.close(); interactionCleanupRef.current?.(); };
    } else {
      waitForInteraction();
      return () => { audio.pause(); stopMouthSync(); audioCtxRef.current?.close(); chimeCtxRef.current?.close(); interactionCleanupRef.current?.(); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() { if (status === "playing") pause(); else play(); }

  // Compose transform: intro spin, then idle wander
  const introTransform = introSpin
    ? "rotate(360deg) scale(1.1)"
    : "";

  return (
    <div onClick={toggle} style={{ position: "relative", width: "100%", height: 260, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <div style={{
        opacity: visible ? 1 : 0,
        transition: introSpin
          ? "opacity 0.4s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)",
        transform: visible
          ? introTransform || "translateY(0) scale(1)"
          : "translateY(30px) scale(0.7)",
        animation: visible && !introSpin ? "citWander 6s ease-in-out infinite" : "none",
      }}>
        <CitHead mouthOpen={mouthOpen} mouthShape={mouthShape} size={200} />
      </div>

      {status === "blocked" && (
        <div style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          color: isDark ? "rgba(0,212,170,0.5)" : "rgba(0,107,87,0.45)",
          fontFamily: "system-ui, sans-serif", animation: "citPulse 2s ease-in-out infinite", whiteSpace: "nowrap",
        }}>
          tap to listen
        </div>
      )}

      <style>{`
        @keyframes citPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes citWander {
          0%   { transform: translate(0, 0) rotate(0deg); }
          15%  { transform: translate(12px, -8px) rotate(3deg); }
          30%  { transform: translate(-6px, -14px) rotate(-2deg); }
          45%  { transform: translate(-16px, -4px) rotate(-4deg); }
          60%  { transform: translate(4px, 6px) rotate(2deg); }
          75%  { transform: translate(14px, -2px) rotate(3.5deg); }
          90%  { transform: translate(-4px, -10px) rotate(-1.5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
