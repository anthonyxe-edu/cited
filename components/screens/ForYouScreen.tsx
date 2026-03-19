"use client";

import React, { useState } from "react";
import { Icon, IDs } from "@/components/ui/Icons";
import { Dots } from "@/components/ui/Badges";
import { Collapse } from "@/components/ui/Collapse";
import { useTheme } from "@/lib/theme";
import type { Suggestion, Screen, UserProfile, SavedEntry } from "@/types";

const CAT_COLORS: Record<string, { c: string; bg: string; icon: string }> = {
  nutrition: { c: "#22C55E", bg: "#22C55E15", icon: IDs.bar },
  exercise: { c: "#3B82F6", bg: "#3B82F615", icon: IDs.zap },
  recovery: { c: "#F59E0B", bg: "#F59E0B15", icon: IDs.sparkle },
  wellness: { c: "#8B5CF6", bg: "#8B5CF615", icon: IDs.brain },
  sleep: { c: "#6366F1", bg: "#6366F115", icon: IDs.eye },
};

interface ForYouScreenProps {
  profile: UserProfile | null;
  recentSearches: string[];
  savedItems: SavedEntry[];
  onNav: (s: Screen) => void;
  onSearch: (q: string) => void;
}

const CATEGORIES = ["All", "nutrition", "exercise", "recovery", "sleep", "wellness"] as const;
type CatFilter = typeof CATEGORIES[number];

export function ForYouScreen({ profile, recentSearches, savedItems, onNav, onSearch }: ForYouScreenProps) {
  const { C } = useTheme();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [catFilter, setCatFilter] = useState<CatFilter>("All");

  const hasContext = Object.keys(profile ?? {}).length > 0 || savedItems.length > 0 || recentSearches.length > 0;

  function generate() {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setExpanded(null);

    fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile,
        recentSearches,
        savedTopics: savedItems.map((i) => i.query),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSuggestions(data.suggestions);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(135deg,#0A1628,#00B894)`, padding: "24px 18px 20px" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "white" }}>For You</h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Personalized suggestions based on your research</p>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {!hasContext && (
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>Get personalized suggestions</p>
              <p style={{ fontSize: 13, color: C.ts, marginBottom: 16, lineHeight: 1.5 }}>Search for a health topic, save results, or set up your profile.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onNav("home")} className="gradient-button" style={{ flex: 1, border: "none", borderRadius: 12, padding: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "white" }}>Search</button>
                <button onClick={() => onNav("profile")} style={{ flex: 1, background: C.surfaceAlt, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Set Profile</button>
              </div>
            </div>
          </div>
        )}

        {hasContext && !suggestions && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
            <p style={{ fontSize: 14, color: C.ts, textAlign: "center", lineHeight: 1.5 }}>
              Based on your profile{recentSearches.length > 0 ? " and recent searches" : ""}, CITED can suggest personalized nutrition plans, workout ideas, and wellness tips.
            </p>
            <button onClick={generate} className="gradient-button" style={{ border: "none", borderRadius: 14, padding: "14px 32px", cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: "white" }}>
              <Icon d={IDs.sparkle} size={18} color="white" /> Generate My Suggestions
            </button>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#0A1628,#132040)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#00D4AA" }}>✚</span>
            </div>
            <Dots />
            <p style={{ color: C.ts, fontSize: 14, marginTop: 12 }}>Building your personalized plan...</p>
          </div>
        )}

        {error && (
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <p style={{ color: C.error, fontSize: 14, textAlign: "center" }}>{error}</p>
            <button onClick={generate} className="gradient-button" style={{ display: "block", margin: "12px auto 0", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "white" }}>Try Again</button>
          </div>
        )}

        {suggestions && (
          <>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {CATEGORIES.map((c) => {
                const cat = CAT_COLORS[c] ?? { c: C.ts, bg: `${C.ts}15` };
                const active = catFilter === c;
                return (
                  <button key={c} onClick={() => setCatFilter(c)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${active ? cat.c : C.border}`, background: active ? cat.c : C.surface, color: active ? "white" : C.ts, fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                    {c === "All" ? "All" : c}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.filter(sg => catFilter === "All" || sg.category === catFilter).map((sg, i) => {
                const cat = CAT_COLORS[sg.category] ?? CAT_COLORS.wellness;
                const isExp = expanded === i;
                return (
                  <div key={i} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${isExp ? cat.c + "40" : C.borderLight}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                    <div onClick={() => setExpanded(isExp ? null : i)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon d={cat.icon} size={16} color={cat.c} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: cat.c, textTransform: "uppercase", letterSpacing: 0.5 }}>{sg.category}</span>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{sg.title}</div>
                        </div>
                        <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }} />
                      </div>
                      <p style={{ fontSize: 13, color: C.ts, margin: 0, lineHeight: 1.5 }}>{sg.summary}</p>
                    </div>
                    <Collapse open={isExp}>
                      <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.borderLight}` }}>
                        <div style={{ marginTop: 12, marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>How to do it:</div>
                          <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>{sg.detail}</p>
                        </div>
                        <div style={{ background: cat.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon d={IDs.target} size={14} color={cat.c} />
                            <p style={{ fontSize: 12, color: cat.c, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>Why: {sg.why}</p>
                          </div>
                        </div>
                        <button onClick={() => onSearch(sg.title)} className="gradient-button" style={{ width: "100%", border: "none", borderRadius: 10, padding: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Icon d={IDs.search} size={14} color={C.primary} /> Search This
                        </button>
                      </div>
                    </Collapse>
                  </div>
                );
              })}
            </div>
            {suggestions.filter(sg => catFilter === "All" || sg.category === catFilter).length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 0", color: C.tt, fontSize: 14 }}>No suggestions in this category. Try refreshing.</div>
            )}
            <button onClick={generate} className="gradient-button" style={{ border: "none", borderRadius: 12, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon d={IDs.sparkle} size={16} color={C.ts} /> Refresh Suggestions
            </button>
          </>
        )}
      </div>
    </div>
  );
}
