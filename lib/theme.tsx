"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Unified color tokens ────────────────────────────────────────────────────
export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgCardAlt: string;
  text: string;
  ts: string;
  tt: string;
  border: string;
  borderLight: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryDark: string;
  primaryDeep: string;
  primaryLight: string;
  success: string;
  error: string;
  accent: string;
  accentLight: string;
}

const DARK: ThemeColors = {
  bg:          "#0A1628",
  bgCard:      "rgba(255,255,255,0.05)",
  bgCardAlt:   "rgba(255,255,255,0.03)",
  surface:     "rgba(255,255,255,0.05)",
  surfaceAlt:  "rgba(255,255,255,0.03)",
  text:        "#FFFFFF",
  ts:          "rgba(255,255,255,0.6)",
  tt:          "rgba(255,255,255,0.3)",
  border:      "rgba(255,255,255,0.09)",
  borderLight: "rgba(255,255,255,0.06)",
  primary:     "#00D4AA",
  primaryDark: "#00B894",
  primaryDeep: "#0A1628",
  primaryLight:"rgba(0,212,170,0.15)",
  success:     "#10B981",
  error:       "#FF6B6B",
  accent:      "#F59E0B",
  accentLight: "rgba(245,158,11,0.12)",
};

// Light = the previous palette the app had before the dark redesign
const LIGHT: ThemeColors = {
  bg:          "#F0FDFA",
  bgCard:      "#FFFFFF",
  bgCardAlt:   "#F8FAFC",
  surface:     "#FFFFFF",
  surfaceAlt:  "#F8FAFC",
  text:        "#0F172A",
  ts:          "#475569",
  tt:          "#94A3B8",
  border:      "#E2E8F0",
  borderLight: "#F1F5F9",
  primary:     "#00D4AA",
  primaryDark: "#00B894",
  primaryDeep: "#0A1628",
  primaryLight:"#CCFBF1",
  success:     "#10B981",
  error:       "#EF4444",
  accent:      "#F59E0B",
  accentLight: "#FEF3C7",
};

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DARK : LIGHT;
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
  C: ThemeColors;
}

const ThemeContext = createContext<ThemeCtx>({
  isDark: true,
  toggle: () => {},
  C: DARK,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Persist preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cited-theme");
      if (saved === "light") setIsDark(false);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    document.body.style.background = isDark ? "#0A1628" : "#F0FDFA";
  }, [isDark]);

  function toggle() {
    setIsDark((d) => {
      const next = !d;
      try { localStorage.setItem("cited-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle, C: getColors(isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}
