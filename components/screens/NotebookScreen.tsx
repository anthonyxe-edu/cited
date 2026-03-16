"use client";

import React, { useState } from "react";
import { Icon, IDs } from "@/components/ui/Icons";
import { EvBadge, Badge, DbBadge } from "@/components/ui/Badges";
import { useTheme } from "@/lib/theme";
import type { SavedEntry } from "@/types";

function stripCites(text?: string) {
  return (text || "").replace(/\[(\d+(?:\s*[,\s]\s*\d+)*)\]/g, "").trim();
}

function firstSentence(text?: string) {
  const clean = stripCites(text);
  const m = clean.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : clean.substring(0, 120) + "...";
}

interface NotebookScreenProps {
  items: SavedEntry[];
  onDelete: (idx: number) => void;
  onViewResult: (item: SavedEntry) => void;
}

export function NotebookScreen({ items, onDelete, onViewResult }: NotebookScreenProps) {
  const { C } = useTheme();
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
      <div style={{ background: C.surface, padding: "24px 18px 18px", borderBottom: `1px solid ${C.borderLight}` }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, fontFamily: "system-ui,sans-serif" }}>My Notebook</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.tt }}>{items.length} saved {items.length === 1 ? "entry" : "entries"}</p>
      </div>

      <div style={{ padding: "12px 18px" }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <p style={{ color: C.tt, fontSize: 15, marginBottom: 6 }}>Your notebook is empty</p>
            <p style={{ color: C.tt, fontSize: 13 }}>Save a search result to see it here</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, i) => {
            const r = item.result;
            if (!r) return null;
            const isExp = expanded === i;
            const topSources = (r.sources ?? []).filter((s) => s.verified).slice(0, 3);

            return (
              <div key={i} style={{ background: C.surface, borderRadius: 14, border: `1px solid ${isExp ? C.primary + "40" : C.borderLight}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                <div onClick={() => setExpanded(isExp ? null : i)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{item.query}</div>
                    <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.primary, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>Insight:</span>
                    <p style={{ fontSize: 13, color: C.ts, margin: 0, lineHeight: 1.5 }}>{firstSentence(r.evidence_summary)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <EvBadge level={r.evidence_quality?.level ?? "Moderate"} />
                    <Badge color={C.ts}>{(r.sources ?? []).filter((s) => s.verified).length} sources</Badge>
                    <span style={{ fontSize: 11, color: C.tt, marginLeft: "auto" }}>{new Date(item.savedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {isExp && (
                  <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.borderLight}` }}>
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Top Sources</div>
                      {topSources.map((s, si) => (
                        <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, borderRadius: 10, background: C.primary, color: "white", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{si + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{s.title}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, color: C.tt }}>{s.authors?.split(",")[0]}</span>
                              <span style={{ fontSize: 10, color: C.tt }}>· {s.year}</span>
                              {s.source_db && <DbBadge db={s.source_db} />}
                              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.primary, fontWeight: 600, marginLeft: "auto", whiteSpace: "nowrap" }}>Open ↗</a>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => onViewResult(item)} style={{ flex: 1, background: `${C.primary}10`, border: `1.5px solid ${C.primary}`, borderRadius: 10, padding: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.primary }}>Full Result</button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(i); }} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, color: C.tt, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon d={IDs.trash} size={13} color={C.tt} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
