"use client";

import { useEffect, useRef, useState } from "react";

/* ── Cit avatar — clay mascot bust for profile pictures ────────────────────── */

interface CitAvatarProps {
  size?: number;
  speaking?: boolean;
}

export function CitAvatar({ size = 36, speaking = false }: CitAvatarProps) {
  const [mouthPhase, setMouthPhase] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!speaking) {
      setMouthPhase(0);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let t = 0;
    function frame() {
      t += 0.12;
      const open =
        Math.abs(Math.sin(t * 2.3)) * 0.5 +
        Math.abs(Math.sin(t * 3.7)) * 0.3 +
        Math.abs(Math.sin(t * 1.1)) * 0.2;
      setMouthPhase(open);
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [speaking]);

  const BASE   = "#4B7D50";
  const LIGHT  = "#5A9460";
  const SHADOW = "#3D6842";

  const mouthRx = 3 + mouthPhase * 1.5;
  const mouthRy = 1.2 + mouthPhase * 3;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(75,125,80,0.1)",
        border: "1.5px solid rgba(75,125,80,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width={size * 0.82}
        height={size * 0.82}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="citAvBodyGrad" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={LIGHT} />
            <stop offset="40%" stopColor={BASE} />
            <stop offset="100%" stopColor={SHADOW} />
          </linearGradient>
        </defs>

        {/* Cross head — centered */}
        <rect x="36" y="6" width="28" height="56" rx="9" fill="url(#citAvBodyGrad)" />
        <rect x="22" y="20" width="56" height="28" rx="9" fill="url(#citAvBodyGrad)" />

        {/* Head highlights */}
        <rect x="40" y="10" width="10" height="20" rx="5" fill="rgba(255,255,255,0.07)" />
        <rect x="27" y="24" width="18" height="10" rx="5" fill="rgba(255,255,255,0.05)" />

        {/* Mouth */}
        <ellipse
          cx="50"
          cy="50"
          rx={mouthRx}
          ry={mouthRy}
          fill="#3A2A20"
          stroke="#2F5233"
          strokeWidth="0.6"
        />

        {/* Neck + shoulders */}
        <rect x="44" y="62" width="12" height="10" rx="6" fill={BASE} />
        {/* Torso top */}
        <rect x="34" y="70" width="32" height="24" rx="12" fill="url(#citAvBodyGrad)" />
        {/* Shoulder bumps */}
        <ellipse cx="32" cy="76" rx="6" ry="8" fill={BASE} />
        <ellipse cx="68" cy="76" rx="6" ry="8" fill={BASE} />
      </svg>
    </div>
  );
}
