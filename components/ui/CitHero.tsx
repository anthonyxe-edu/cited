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

/* ── Cit — fluid clay mascot ───────────────────────────────────────────────── */
function CitCharacter({ mouthOpen, size = 260 }: { mouthOpen: number; size?: number }) {
  const BASE   = "#4B7D50";
  const LIGHT  = "#5A9460";
  const SHADOW = "#3D6842";
  const DEEP   = "#2F5233";

  const mouthRx = 3.5 + mouthOpen * 1.5;
  const mouthRy = 1.5 + mouthOpen * 3;

  return (
    <svg
      width={size}
      height={size * 1.05}
      viewBox="0 0 200 210"
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
        <linearGradient id="cGL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={LIGHT} />
          <stop offset="100%" stopColor={SHADOW} />
        </linearGradient>
        <filter id="cS"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* Ground shadow (no disc) */}
      <ellipse cx="100" cy="202" rx="34" ry="5" fill="rgba(0,0,0,0.07)" filter="url(#cS)" />

      {/* ══════ BODY — single fluid path: torso + hips + legs + feet ══════
           Drawn as one continuous shape so there are NO seams.
           Starts at left shoulder, goes down left side, left leg, foot,
           crosses to right foot, right leg, up right side to right shoulder,
           then curves across the top (chest). */}
      <g className="cit-body">
        <path
          d={`
            M 82,118
            C 78,118 76,124 76,132
            L 76,168
            C 76,174 78,178 82,178
            L 82,195
            C 82,200 84,204 89,204
            C 94,204 96,200 96,195
            L 96,178
            L 104,178
            L 104,195
            C 104,200 106,204 111,204
            C 116,204 118,200 118,195
            L 118,178
            C 122,178 124,174 124,168
            L 124,132
            C 124,124 122,118 118,118
            Z
          `}
          fill="url(#cG)"
        />
        {/* Torso highlight */}
        <path
          d="M 88,122 C 86,122 85,128 85,134 L 85,155 C 85,158 86,160 88,160 L 98,160 L 98,134 C 98,128 97,122 95,122 Z"
          fill="rgba(255,255,255,0.06)"
        />
        {/* Feet — flush rounded ends */}
        <ellipse cx="89" cy="203" rx="9" ry="5" fill={BASE} />
        <ellipse cx="111" cy="203" rx="9" ry="5" fill={BASE} />
      </g>

      {/* ══════ LEFT ARM (viewer's left) — waving, one fluid path ══════ */}
      <g className="cit-wave-arm" style={{ transformOrigin: "80px 125px" }}>
        <path
          d={`
            M 78,122
            C 72,120 66,114 60,106
            C 56,100 50,90 48,84
            C 46,78 48,74 52,74
            C 56,74 58,78 60,84
            C 62,90 66,96 70,102
            C 74,108 76,112 76,118
            Z
          `}
          fill="url(#cGL)"
        />
        {/* Hand */}
        <ellipse cx="50" cy="76" rx="7" ry="7.5" fill={BASE} />
        {/* Fingers — flush with hand */}
        <path
          d="M 46,70 C 45,66 46,64 48,64 C 50,64 51,66 50,70 Z"
          fill={LIGHT}
        />
        <path
          d="M 50,68 C 49,64 50,62 52,62 C 54,62 55,64 54,68 Z"
          fill={LIGHT}
        />
        <path
          d="M 54,70 C 53,66 54,64 56,64 C 58,64 59,66 58,70 Z"
          fill={LIGHT}
        />
      </g>

      {/* ══════ RIGHT ARM — relaxed, one fluid path ══════ */}
      <g className="cit-rest-arm" style={{ transformOrigin: "120px 125px" }}>
        <path
          d={`
            M 122,122
            C 126,124 130,132 132,142
            C 134,152 134,164 132,172
            C 130,178 128,180 126,180
            C 124,180 122,178 122,172
            C 122,164 122,152 124,142
            C 124,136 124,128 124,122
            Z
          `}
          fill="url(#cGL)"
        />
        {/* Hand — flush fist */}
        <ellipse cx="128" cy="178" rx="6" ry="6.5" fill={BASE} />
      </g>

      {/* ══════ NECK — flush bridge between torso and head ══════ */}
      <path
        d="M 92,118 C 92,112 94,108 100,108 C 106,108 108,112 108,118 L 108,122 L 92,122 Z"
        fill={BASE}
      />

      {/* ══════ CROSS HEAD ══════ */}
      <g className="cit-head" style={{ transformOrigin: "100px 70px" }}>
        {/* Shadow under head */}
        <ellipse cx="100" cy="110" rx="20" ry="3.5" fill="rgba(0,0,0,0.05)" filter="url(#cS)" />
        {/* Vertical bar */}
        <rect x="82" y="26" width="36" height="86" rx="13" fill="url(#cG)" />
        {/* Horizontal bar */}
        <rect x="56" y="46" width="88" height="36" rx="13" fill="url(#cG)" />
        {/* Highlight — top-left */}
        <rect x="87" y="31" width="14" height="28" rx="7" fill="rgba(255,255,255,0.08)" />
        <rect x="62" y="51" width="28" height="14" rx="7" fill="rgba(255,255,255,0.06)" />
        {/* Shadow — bottom-right */}
        <rect x="96" y="84" width="18" height="22" rx="9" fill="rgba(0,0,0,0.04)" />
        <rect x="114" y="58" width="24" height="16" rx="8" fill="rgba(0,0,0,0.04)" />
        {/* Mouth */}
        <ellipse cx="100" cy="96" rx={mouthRx} ry={mouthRy} fill="#3A2A20" stroke={DEEP} strokeWidth="0.8" />
        {mouthOpen > 0.3 && (
          <ellipse cx="100" cy={95.5 + mouthOpen} rx={mouthRx * 0.5} ry={mouthRy * 0.35} fill="#5A3A2A" />
        )}
      </g>

      {/* ══════ IDLE ANIMATION STYLES ══════ */}
      <style>{`
        .cit-body {
          animation: citSway 2.8s ease-in-out infinite;
          transform-origin: 100px 170px;
        }
        .cit-head {
          animation: citHeadTilt 3.2s ease-in-out infinite;
        }
        .cit-wave-arm {
          animation: citWave 1.6s ease-in-out infinite;
        }
        .cit-rest-arm {
          animation: citArmSwing 2.8s ease-in-out infinite;
        }
        @keyframes citSway {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          30% { transform: rotate(1.2deg) translateX(2px); }
          70% { transform: rotate(-1.2deg) translateX(-2px); }
        }
        @keyframes citHeadTilt {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          25% { transform: rotate(-2deg) translateY(-1px); }
          75% { transform: rotate(2.5deg) translateY(1px); }
        }
        @keyframes citWave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          50% { transform: rotate(8deg); }
          75% { transform: rotate(-8deg); }
        }
        @keyframes citArmSwing {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(3deg); }
          60% { transform: rotate(-2deg); }
        }
      `}</style>
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

  const audioRef    = useRef<HTMLAudioElement|null>(null);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const animRef     = useRef<number|null>(null);
  const chimeCtxRef = useRef<AudioContext|null>(null);
  const interactionCleanupRef = useRef<(()=>void)|null>(null);

  const startMouthSync = useCallback(() => {
    const analyser = analyserRef.current;
    const data = analyser ? new Uint8Array(analyser.fftSize) : null;
    function frame() {
      if (analyser && data) {
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s,v) => s + Math.pow((v-128)/128,2), 0) / data.length);
        setMouthOpen(prev => prev * 0.45 + Math.min(rms * 18, 1) * 0.55);
      }
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }, []);

  function stopMouthSync() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setMouthOpen(0);
  }

  async function play() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.85;
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
    function onInteraction() { cleanup(); playChime(chimeCtxRef); play(); }
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

  useEffect(() => {
    const audio = new Audio(AUDIO_SRC); audio.preload = "auto"; audioRef.current = audio;
    audio.onended = () => { stopMouthSync(); setStatus("ended"); onEnded?.(); };
    const allowed = canAutoplay();
    if (allowed) {
      const chimeT = setTimeout(() => { playChime(chimeCtxRef); setVisible(true); }, CHIME_DELAY);
      const playT = setTimeout(() => play(), AUTOPLAY_DELAY);
      return () => { clearTimeout(chimeT); clearTimeout(playT); audio.pause(); stopMouthSync(); audioCtxRef.current?.close(); chimeCtxRef.current?.close(); interactionCleanupRef.current?.(); };
    } else {
      waitForInteraction();
      return () => { audio.pause(); stopMouthSync(); audioCtxRef.current?.close(); chimeCtxRef.current?.close(); interactionCleanupRef.current?.(); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle() { if (status === "playing") pause(); else play(); }

  return (
    <div onClick={toggle} style={{ position: "relative", width: "100%", height: 320, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.85)",
        transition: "opacity 1.4s cubic-bezier(0.16,1,0.3,1), transform 1.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <CitCharacter mouthOpen={mouthOpen} size={260} />
      </div>
      {status === "blocked" && (
        <div style={{
          position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          color: isDark ? "rgba(0,212,170,0.5)" : "rgba(0,107,87,0.45)",
          fontFamily: "system-ui, sans-serif", animation: "citPulse 2s ease-in-out infinite", whiteSpace: "nowrap",
        }}>
          tap to listen
        </div>
      )}
      <style>{`@keyframes citPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}
