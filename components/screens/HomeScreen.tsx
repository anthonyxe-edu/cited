"use client";

import React, { useState } from "react";
import { Icon, IDs } from "@/components/ui/Icons";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

// Category accent colors
const CATEGORY_COLOR: Record<string, string> = {
  Supplements: "#00D4AA",
  Exercise:    "#F59E0B",
  Nutrition:   "#34D399",
  Recovery:    "#818CF8",
  Sleep:       "#60A5FA",
  "Mental Health": "#F472B6",
  All:         "#00D4AA",
};

const BG_DARK = "#0A1628";

// SVG category icons — no emoji
function CategoryIcon({ topic, size = 14 }: { topic: string; size?: number }) {
  const color = CATEGORY_COLOR[topic] ?? "#00D4AA";
  const s = size;
  switch (topic) {
    case "Supplements":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <rect x="1" y="4" width="12" height="6" rx="3" fill={color} opacity="0.9" />
          <line x1="7" y1="4" x2="7" y2="10" stroke={BG_DARK} strokeWidth="1.2" />
        </svg>
      );
    case "Exercise":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <polyline points="2,11 5,3 8,9 10,5 12,8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "Nutrition":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <path d="M7 1 C4 1 2 4 2 7 C2 10 4 13 7 13 C10 13 12 10 12 7 C12 4 10 1 7 1Z" fill={color} opacity="0.85" />
          <path d="M7 4 C7 4 5 6 5 8 C5 9.1 5.9 10 7 10 C8.1 10 9 9.1 9 8 C9 6 7 4 7 4Z" fill={BG_DARK} opacity="0.5" />
        </svg>
      );
    case "Recovery":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <path d="M1 7 Q3.5 3 7 7 Q10.5 11 13 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "Sleep":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <path d="M9 2 C6 2 3 4.5 3 7.5 C3 10.5 5.5 12 8.5 12 C9.5 12 10.5 11.7 11.3 11.2 C8.5 10.5 6.5 8.2 6.5 5.5 C6.5 4 7.5 2.8 9 2Z" fill={color} opacity="0.9" />
        </svg>
      );
    case "Mental Health":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="5.5" r="3" stroke={color} strokeWidth="1.4" fill="none" />
          <line x1="7" y1="8.5" x2="7" y2="11" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="5" y1="10" x2="9" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    default:
      return <div style={{ width: s, height: s, borderRadius: "50%", background: color }} />;
  }
}

const TOPICS = ["All", "Supplements", "Exercise", "Nutrition", "Recovery", "Sleep", "Mental Health"] as const;
type Topic = typeof TOPICS[number];

const ALL_TRENDING = [
  { label: "Creatine for teens",    q: "creatine supplementation for teenage athletes",            topic: "Supplements" },
  { label: "Sleep & recovery",      q: "sleep quality and muscle recovery",                        topic: "Sleep" },
  { label: "Omega-3 & cognition",   q: "omega-3 fatty acids and cognitive focus",                  topic: "Supplements" },
  { label: "Caffeine timing",       q: "caffeine timing for athletic performance",                  topic: "Exercise" },
  { label: "Iron deficiency",       q: "low ferritin iron deficiency in athletes",                  topic: "Nutrition" },
  { label: "Protein timing",        q: "protein timing around workouts for muscle gain",            topic: "Nutrition" },
  { label: "Zone 2 training",       q: "zone 2 cardio training benefits for endurance",             topic: "Exercise" },
  { label: "Melatonin safety",      q: "melatonin supplementation dosage and safety",               topic: "Sleep" },
  { label: "Magnesium & stress",    q: "magnesium supplementation and stress reduction",            topic: "Mental Health" },
  { label: "Cold exposure",         q: "cold water immersion and recovery benefits",                topic: "Recovery" },
  { label: "Vitamin D optimum",     q: "optimal vitamin D levels and supplementation",              topic: "Supplements" },
  { label: "HRV as a marker",       q: "heart rate variability as a recovery metric",               topic: "Recovery" },
];

const TEMPLATES = [
  { label: "Does ___ work?",               prefix: "Does " },
  { label: "Is ___ safe?",                 prefix: "Is " },
  { label: "Optimal dose of ___",          prefix: "What is the optimal dose of " },
  { label: "Compare protocols",            prefix: "Compare the evidence on " },
];

interface HomeScreenProps {
  onSearch: (q: string) => void;
  recentSearches: string[];
  onClearRecent: () => void;
  prefillQuery?: string;
}

export function HomeScreen({ onSearch, recentSearches, onClearRecent, prefillQuery }: HomeScreenProps) {
  const { C, isDark, toggle } = useTheme();
  const [query, setQuery] = useState(prefillQuery ?? "");
  const [activeTopic, setActiveTopic] = useState<Topic>("All");

  function go() {
    const q = query.trim();
    if (q.length > 2) onSearch(q);
  }

  function applyTemplate(prefix: string) {
    setQuery(prefix);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[data-cited-search]');
      if (input) { input.focus(); input.setSelectionRange(prefix.length, prefix.length); }
    }, 50);
  }

  const filtered = activeTopic === "All" ? ALL_TRENDING : ALL_TRENDING.filter(t => t.topic === activeTopic);

  return (
    <div className="cited-home" style={{ minHeight: "100vh", background: C.bg, paddingBottom: 90, fontFamily: "system-ui,-apple-system,sans-serif", position: "relative", overflow: "hidden" }}>

      {/* Ambient glow orbs — fills the side thirds with personality */}
      <div style={{ position: "absolute", top: -80, left: -100, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,212,170,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 120, right: -120, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,184,148,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 460, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,212,170,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "relative", padding: "40px 28px 44px", borderBottom: `1px solid ${C.border}` }}>
        {/* Dot grid texture */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#00D4AA", lineHeight: 1 }}>✚</span>
              </div>
              <span style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: 1.4 }}>
                CI<span style={{ color: "#00D4AA" }}>✚</span>ED
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.tt, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Health Technology</span>
              <button
                onClick={toggle}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={14} color={C.tt} /> : <Moon size={14} color={C.tt} />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "4px 4px 4px 16px", boxShadow: "0 0 0 0 rgba(0,212,170,0)" }}>
              <Icon d={IDs.search} size={17} color={C.tt} />
              <input
                data-cited-search
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") go(); }}
                placeholder="Search any health or nutrition topic..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: C.text, background: "transparent", padding: "11px 0" }}
              />
              <button
                onClick={go}
                disabled={query.trim().length < 3}
                className={query.trim().length > 2 ? "gradient-button" : undefined}
                style={{ background: query.trim().length > 2 ? undefined : C.border, border: "none", borderRadius: 10, padding: "10px 20px", cursor: query.trim().length > 2 ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6, color: query.trim().length > 2 ? "white" : C.ts, fontSize: 14, fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap" }}
              >
                <Icon d={IDs.sparkle} size={14} color={query.trim().length > 2 ? "white" : C.ts} /> Search
              </button>
            </div>
          </div>

          {/* Template chips */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t.prefix)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 13px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: C.ts, whiteSpace: "nowrap", transition: "all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px" }}>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.tt, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recent</span>
              <button onClick={onClearRecent} style={{ background: "none", border: "none", cursor: "pointer", color: C.tt, fontSize: 11, fontWeight: 600, padding: 0 }}>Clear</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentSearches.slice(0, 3).map((s, i) => (
                <button key={i} onClick={() => onSearch(s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 11, padding: "11px 14px", cursor: "pointer", textAlign: "left" }}>
                  <Icon d={IDs.clock} size={14} color={C.tt} />
                  <span style={{ fontSize: 13, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                  <Icon d={IDs.chevRight} size={13} color={C.tt} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section heading + filter row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.tt, letterSpacing: "0.1em", textTransform: "uppercase" }}>Trending Topics</span>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
            {TOPICS.map(t => (
              <button key={t} onClick={() => setActiveTopic(t)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${activeTopic === t ? CATEGORY_COLOR[t] : C.border}`, background: activeTopic === t ? `${CATEGORY_COLOR[t]}18` : "transparent", color: activeTopic === t ? CATEGORY_COLOR[t] : C.ts, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Trending grid — auto-fill columns uses all the horizontal space */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 28 }}>
          {filtered.map((t, i) => {
            const color = CATEGORY_COLOR[t.topic];
            return (
              <button key={i} onClick={() => onSearch(t.q)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, textAlign: "left", transition: "border-color 0.15s", position: "relative", overflow: "hidden" }}>
                {/* Subtle color accent line at top */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)`, borderRadius: "14px 14px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CategoryIcon topic={t.topic} size={13} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.topic}</span>
                </div>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600, lineHeight: 1.35 }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div style={{ padding: "12px 16px", background: C.surfaceAlt, borderRadius: 12, border: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <Icon d={IDs.info} size={10} color="#00D4AA" />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: C.tt, lineHeight: 1.6 }}>
            <strong style={{ color: C.ts }}>Not medical advice.</strong> CITED is a peer-reviewed evidence research tool. Always consult a qualified healthcare professional before making health decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
