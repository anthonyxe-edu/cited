"use client";

import React from "react";
import { Icon, IDs } from "./Icons";

const C = {
  primary: "#00D4AA",
  success: "#10B981",
  ts: "#475569",
  tt: "#94A3B8",
  border: "#E2E8F0",
  surfaceAlt: "#F8FAFC",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}

export function Badge({ children, color = C.primary, bg }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg ?? `${color}18`,
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

interface EvBadgeProps {
  level: "High" | "Moderate" | "Low";
}

const EV_GRADE: Record<string, { letter: string; c: string; label: string }> = {
  High:     { letter: "A", c: "#10B981", label: "Strong Evidence" },
  Moderate: { letter: "B", c: "#F59E0B", label: "Moderate Evidence" },
  Low:      { letter: "C", c: "#EF4444", label: "Limited Evidence" },
};

export function EvBadge({ level }: EvBadgeProps) {
  const x = EV_GRADE[level] ?? EV_GRADE.Moderate;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: x.c, background: `${x.c}18`, letterSpacing: 0.3 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: x.c, color: "white", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{x.letter}</span>
      {x.label}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        color: C.success,
        background: `${C.success}15`,
        letterSpacing: 0.3,
      }}
    >
      <Icon d={IDs.verified} size={11} color={C.success} />
      VERIFIED
    </span>
  );
}

interface DbBadgeProps {
  db: string;
}

export function DbBadge({ db }: DbBadgeProps) {
  const colors: Record<string, { c: string; bg: string }> = {
    PubMed:                  { c: "#326599", bg: "#32659915" },
    PMC:                     { c: "#1A6B50", bg: "#1A6B5015" },
    "Semantic Scholar":      { c: "#6B4C9A", bg: "#6B4C9A15" },
    "ClinicalTrials.gov":    { c: "#C4712B", bg: "#C4712B15" },
    EuropePMC:               { c: "#2A7F62", bg: "#2A7F6215" },
    "Google Scholar":        { c: "#C53929", bg: "#C5392915" },
    Other:                   { c: C.ts,      bg: `${C.ts}15`  },
  };
  const x = colors[db] ?? colors.Other;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: x.c, background: x.bg, letterSpacing: 0.2 }}>
      {db}
    </span>
  );
}

interface StudyTypeBadgeProps {
  type: string;
}

const STUDY_COLORS: Record<string, { c: string; bg: string }> = {
  "meta-analysis":  { c: "#7C3AED", bg: "#7C3AED15" },
  "systematic review": { c: "#7C3AED", bg: "#7C3AED15" },
  rct:              { c: "#2563EB", bg: "#2563EB15" },
  "randomized controlled trial": { c: "#2563EB", bg: "#2563EB15" },
  cohort:           { c: "#0891B2", bg: "#0891B215" },
  observational:    { c: "#059669", bg: "#05966915" },
  "case report":    { c: "#D97706", bg: "#D9770615" },
  "case study":     { c: "#D97706", bg: "#D9770615" },
  review:           { c: "#475569", bg: "#47556915" },
};

export function StudyTypeBadge({ type }: StudyTypeBadgeProps) {
  const key = type?.toLowerCase() ?? "";
  const match = Object.keys(STUDY_COLORS).find((k) => key.includes(k));
  const x = match ? STUDY_COLORS[match] : { c: "#475569", bg: "#47556918" };
  const label = type
    .replace("randomized controlled trial", "RCT")
    .replace("systematic review", "Sys. Review");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, color: x.c, background: x.bg, letterSpacing: 0.2 }}>
      {label}
    </span>
  );
}

export function Dots() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", padding: 20 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: C.primary,
            animation: `cited-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
