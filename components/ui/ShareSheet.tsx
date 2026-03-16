"use client";

import React, { useState } from "react";
import type { Source } from "@/types";
import { Icon, IDs } from "./Icons";

const C = {
  primary: "#00D4AA",
  text: "#0F172A",
  ts: "#475569",
  tt: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  surface: "#FFF",
  surfaceAlt: "#F8FAFC",
  primaryLight: "#CCFBF1",
  primaryDark: "#00B894",
  error: "#EF4444",
};

interface ShareSheetProps {
  query: string;
  evidenceSummary?: string;
  personalSummary?: string;
  sources: Source[];
  onClose: () => void;
}

function stripCites(text?: string) {
  return (text || "").replace(/\[(\d+(?:\s*[,\s]\s*\d+)*)\]/g, "").replace(/\s{2,}/g, " ").trim();
}

export function ShareSheet({ query, evidenceSummary, personalSummary, sources, onClose }: ShareSheetProps) {
  const [includeCtx, setIncludeCtx] = useState(false);
  const [toast, setToast] = useState("");

  function buildText() {
    const lines = [`✚ CITED: ${query}`, ""];
    if (includeCtx && personalSummary) {
      lines.push(`🎯 Personalized: ${stripCites(personalSummary)}`, "");
    } else {
      lines.push(`📊 ${stripCites(evidenceSummary)}`, "");
    }
    lines.push("🔗 Top Sources:");
    sources.slice(0, 5).forEach((s, i) => {
      let line = `${i + 1}. ${s.title}`;
      if (s.verified) line += " ✅";
      if (s.url) line += `\n   ${s.url}`;
      lines.push(line);
    });
    lines.push("", "Powered by CITED — Nothing uncited.");
    return lines.join("\n");
  }

  async function doCopy() {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied!");
    } catch {
      setToast("Copy failed");
    }
    setTimeout(() => setToast(""), 2000);
  }

  function doShare() {
    if (navigator.share) {
      navigator.share({ title: `CITED: ${query}`, text: buildText() }).catch(() => {});
    } else {
      doCopy();
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#0F172A", color: "white", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 300 }}>
          {toast}
        </div>
      )}
      <div style={{ background: C.surface, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", padding: "20px 18px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Share Results</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon d={IDs.x} size={20} color={C.tt} />
          </button>
        </div>

        {/* Privacy toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: C.surfaceAlt, borderRadius: 12, border: `1px solid ${C.borderLight}`, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Include personal context?</div>
            <div style={{ fontSize: 11, color: C.tt }}>Default: OFF — shares general summary only</div>
          </div>
          <button
            onClick={() => setIncludeCtx(!includeCtx)}
            style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: includeCtx ? C.primary : C.border, position: "relative", transition: "background .2s" }}
          >
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: includeCtx ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={doShare} style={{ flex: 1, background: C.primary, color: "white", border: "none", borderRadius: 12, padding: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={IDs.share} size={16} color="white" /> Share
          </button>
          <button onClick={doCopy} style={{ flex: 1, background: C.surfaceAlt, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={IDs.copy} size={16} color={C.ts} /> Copy
          </button>
        </div>
      </div>
    </div>
  );
}
