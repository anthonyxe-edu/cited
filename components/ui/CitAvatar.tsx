"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

/* ── Cit avatar — profile picture for chat/results ─────────────────────────── */

interface CitAvatarProps {
  size?: number;
  speaking?: boolean; // external control for mouth animation
}

export function CitAvatar({ size = 36, speaking = false }: CitAvatarProps) {
  const { isDark } = useTheme();
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
      // Natural-looking mouth movement: layered sine waves
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

  const bgColor = isDark ? "rgba(0,212,170,0.1)" : "rgba(0,180,140,0.08)";
  const borderColor = isDark ? "rgba(0,212,170,0.25)" : "rgba(0,180,140,0.2)";
  const mouthColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(10,22,40,0.75)";
  const bodyColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(10,22,40,0.6)";

  const mouthY = 56;
  const mouthWidth = 5;
  const mouthHeight = mouthPhase * 3.5;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width={size * 0.75}
        height={size * 0.75}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="citAvatarGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5B5" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
        </defs>

        {/* Cross head — centered, oversized relative to body */}
        <rect x="40" y="14" width="20" height="50" rx="6" fill="url(#citAvatarGrad)" />
        <rect x="22" y="32" width="56" height="20" rx="6" fill="url(#citAvatarGrad)" />

        {/* Mouth */}
        {mouthHeight < 0.5 ? (
          <path
            d={`M ${50 - mouthWidth} ${mouthY} Q 50 ${mouthY + 1.5} ${50 + mouthWidth} ${mouthY}`}
            stroke={mouthColor}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          <ellipse
            cx="50"
            cy={mouthY}
            rx={mouthWidth * 0.8}
            ry={mouthHeight}
            fill={isDark ? "rgba(10,22,40,0.6)" : "rgba(255,255,255,0.7)"}
            stroke={mouthColor}
            strokeWidth="0.8"
          />
        )}

        {/* Neck + shoulders hint */}
        <line x1="50" y1="64" x2="50" y2="72" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="72" x2="50" y2="82" stroke={bodyColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="75" x2="36" y2="82" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="75" x2="64" y2="82" stroke={bodyColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
