"use client";

import { useEffect, useRef, useState } from "react";

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

  const BASE   = "#00D4AA";
  const LIGHT  = "#33E0BE";
  const SHADOW = "#00B894";

  const mouthRx = 3 + mouthPhase * 1.5;
  const mouthRy = 1.2 + mouthPhase * 3;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(0,212,170,0.08)",
        border: "1.5px solid rgba(0,212,170,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <svg
        width={size * 0.78}
        height={size * 0.78}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="citAvGrad" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0%" stopColor={LIGHT} />
            <stop offset="35%" stopColor={BASE} />
            <stop offset="100%" stopColor={SHADOW} />
          </linearGradient>
        </defs>

        {/* Cross head — centered */}
        <rect x="38" y="12" width="24" height="76" rx="10" fill="url(#citAvGrad)" />
        <rect x="14" y="30" width="72" height="32" rx="10" fill="url(#citAvGrad)" />

        {/* Highlights */}
        <rect x="42" y="16" width="10" height="22" rx="5" fill="rgba(255,255,255,0.12)" />
        <rect x="20" y="34" width="20" height="10" rx="5" fill="rgba(255,255,255,0.08)" />

        {/* Mouth */}
        <ellipse
          cx="50"
          cy="56"
          rx={mouthRx}
          ry={mouthRy}
          fill="#0A1628"
          stroke="#009B7D"
          strokeWidth="0.6"
        />
      </svg>
    </div>
  );
}
