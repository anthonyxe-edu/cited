"use client";

import React from "react";

interface IconProps {
  d: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ d, size = 20, color = "currentColor", style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export const IDs = {
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8",
  back: "M19 12H5M12 19l-7-7 7-7",
  chevDown: "M6 9l6 6 6-6",
  chevRight: "M9 18l6-6-6-6",
  clock: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2",
  sparkle: "M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8",
  target: "M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0M12 12m-5 0a5 5 0 1010 0 5 5 0 10-10 0M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0",
  bar: "M12 20V10M18 20V4M6 20v-4",
  info: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  brain: "M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  check: "M20 6L9 17l-5-5",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  x: "M18 6L6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  verified: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  notebook: "M9 2h6v2H9V2zM4 6a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM9 10h6M9 14h4",
  compass: "M12 2a10 10 0 100 20 10 10 0 000-20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12",
  dumbbell: "M6.5 6.5h11M17.5 4v5M6.5 4v5M4 5.5h3M17 5.5h3",
  play: "M5 3l14 9-14 9z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  stop: "M18 6L6 18M6 6l12 12",
  volume: "M3 9v6h4l5 5V4L7 9H3z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
};
