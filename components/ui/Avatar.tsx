"use client";

import React from "react";

interface AvatarProps {
  talking?: boolean;
  size?: number;
}

export function Avatar({ talking = false, size = 140 }: AvatarProps) {
  const s = size;
  return (
    <div
      style={{
        width: s,
        height: s * 1.2,
        position: "relative",
        animation: talking ? undefined : "av-float 3s ease-in-out infinite",
      }}
    >
      <svg
        viewBox="0 0 200 240"
        width={s}
        height={s * 1.2}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="av-skin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D6B8" />
            <stop offset="100%" stopColor="#E8C4A0" />
          </linearGradient>
          <linearGradient id="av-hair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D1B0E" />
            <stop offset="100%" stopColor="#1A0F06" />
          </linearGradient>
          <linearGradient id="av-coat" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F0F0F0" />
          </linearGradient>
          <linearGradient id="av-scrub" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <radialGradient id="av-face-shadow" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Body */}
        <g style={{ transformOrigin: "100px 180px", animation: "av-breathe-body 3s ease-in-out infinite" }}>
          <path d="M60 155 Q60 140 80 135 L100 130 L120 135 Q140 140 140 155 L145 235 L55 235 Z" fill="url(#av-coat)" stroke="#E0E0E0" strokeWidth={1} />
          <path d="M88 135 L95 170 L100 145 L105 170 L112 135" fill="none" stroke="#E0E0E0" strokeWidth={1.5} />
          <path d="M85 133 Q100 142 115 133" fill="url(#av-scrub)" />
          <ellipse cx={100} cy={133} rx={16} ry={6} fill="url(#av-scrub)" />
          <rect x={113} y={150} width={22} height={14} rx={3} fill="#0D9488" />
          <text x={124} y={160} textAnchor="middle" fill="white" fontSize={7} fontWeight={900} fontFamily="system-ui,sans-serif">✚ID</text>
          <rect x={65} y={170} width={18} height={2} rx={1} fill="#E0E0E0" />
          <line x1={72} y1={155} x2={74} y2={170} stroke="#0D9488" strokeWidth={2} strokeLinecap="round" />
          <g style={{ transformOrigin: "60px 155px", animation: talking ? "av-gesture-l 2s ease-in-out infinite" : undefined }}>
            <path d="M60 155 Q45 180 50 210" fill="none" stroke="url(#av-coat)" strokeWidth={16} strokeLinecap="round" />
            <ellipse cx={50} cy={212} rx={7} ry={6} fill="url(#av-skin)" />
          </g>
          <g style={{ transformOrigin: "140px 155px", animation: talking ? "av-gesture-r 1.8s ease-in-out infinite" : undefined }}>
            <path d="M140 155 Q155 180 150 210" fill="none" stroke="url(#av-coat)" strokeWidth={16} strokeLinecap="round" />
            <ellipse cx={150} cy={212} rx={7} ry={6} fill="url(#av-skin)" />
          </g>
        </g>

        {/* Head */}
        <g style={{ transformOrigin: "100px 120px", animation: talking ? "av-nod 2.5s ease-in-out infinite" : undefined }}>
          <rect x={92} y={118} width={16} height={18} rx={4} fill="url(#av-skin)" />
          <ellipse cx={100} cy={80} rx={40} ry={46} fill="url(#av-skin)" />
          <ellipse cx={100} cy={95} rx={30} ry={25} fill="url(#av-face-shadow)" />
          <ellipse cx={100} cy={42} rx={42} ry={20} fill="url(#av-hair)" />
          <path d="M58 55 Q56 40 62 35 Q65 50 60 70 Z" fill="url(#av-hair)" />
          <path d="M142 55 Q144 40 138 35 Q135 50 140 70 Z" fill="url(#av-hair)" />
          <path d="M70 38 Q85 30 100 33 Q115 30 130 38" fill="none" stroke="#3D2914" strokeWidth={2} />
          <ellipse cx={60} cy={80} rx={6} ry={10} fill="url(#av-skin)" />
          <ellipse cx={60} cy={80} rx={3} ry={6} fill="#E8B898" />
          <ellipse cx={140} cy={80} rx={6} ry={10} fill="url(#av-skin)" />
          <ellipse cx={140} cy={80} rx={3} ry={6} fill="#E8B898" />
          <path d="M76 62 Q82 58 90 61" fill="none" stroke="#2D1B0E" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M110 61 Q118 58 124 62" fill="none" stroke="#2D1B0E" strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={85} cy={74} rx={8} ry={5} fill="white" style={{ animation: "av-blink 4s ease-in-out infinite" }} />
          <ellipse cx={86} cy={74} rx={4} ry={4} fill="#3B2506" />
          <ellipse cx={87} cy={73} rx={1.5} ry={1.5} fill="white" />
          <ellipse cx={115} cy={74} rx={8} ry={5} fill="white" style={{ animation: "av-blink 4s ease-in-out 0.2s infinite" }} />
          <ellipse cx={116} cy={74} rx={4} ry={4} fill="#3B2506" />
          <ellipse cx={117} cy={73} rx={1.5} ry={1.5} fill="white" />
          <path d="M97 78 Q100 88 103 78" fill="none" stroke="#D4A070" strokeWidth={1.5} strokeLinecap="round" />
          {talking ? (
            <g>
              <ellipse cx={100} cy={98} rx={10} ry={6} fill="#C0453A" style={{ animation: "av-talk 0.3s ease-in-out infinite" }} />
              <rect x={94} y={93} width={12} height={3} rx={1} fill="white" opacity={0.7} />
            </g>
          ) : (
            <path d="M88 96 Q100 106 112 96" fill="none" stroke="#C0453A" strokeWidth={2.5} strokeLinecap="round" />
          )}
          <ellipse cx={73} cy={90} rx={8} ry={5} fill="#FFB5A0" opacity={0.3} />
          <ellipse cx={127} cy={90} rx={8} ry={5} fill="#FFB5A0" opacity={0.3} />
        </g>

        {/* Sound waves */}
        {talking && (
          <g>
            <circle cx={55} cy={98} r={4} fill="none" stroke="#0D9488" strokeWidth={1.5} opacity={0.5} style={{ animation: "av-sound-wave 1.2s ease-out infinite" }} />
            <circle cx={55} cy={98} r={4} fill="none" stroke="#0D9488" strokeWidth={1.5} opacity={0.5} style={{ animation: "av-sound-wave 1.2s ease-out 0.4s infinite" }} />
            <circle cx={145} cy={98} r={4} fill="none" stroke="#0D9488" strokeWidth={1.5} opacity={0.5} style={{ animation: "av-sound-wave 1.2s ease-out 0.2s infinite" }} />
          </g>
        )}
      </svg>
    </div>
  );
}
