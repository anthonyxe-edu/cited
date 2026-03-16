"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/lib/theme";
import { useBreakpoint } from "@/lib/useBreakpoint";
import type { JournalEntry, EvidenceResult, UserProfile } from "@/types";
import { CitedText } from "@/components/ui/CitedText";

// ─── Speech recognition types ──────────────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateStamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  }).toUpperCase();
}

function formatTimeStamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function autoTitle(content: string): string {
  return content.trim().split(/\n/)[0].substring(0, 60) || "Untitled";
}

// ─── Wave bars (voice entry decoration) ───────────────────────────────────────
function WaveBars({ active, color }: { active?: boolean; color: string }) {
  const heights = [10, 18, 14, 22, 10, 16, 8];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 24 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 2,
            background: color,
            opacity: active ? 1 : 0.5,
            animation: active ? `waveBounce 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Entry type badge ─────────────────────────────────────────────────────────
function EntryBadge({ type }: { type: "text" | "voice" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
      textTransform: "uppercase", fontFamily: "monospace",
      padding: "2px 7px", borderRadius: 4,
      background: type === "voice" ? "rgba(0,212,170,0.12)" : "rgba(255,255,255,0.06)",
      color: type === "voice" ? "#00D4AA" : "rgba(255,255,255,0.35)",
      border: type === "voice" ? "1px solid rgba(0,212,170,0.25)" : "1px solid rgba(255,255,255,0.08)",
    }}>
      {type === "voice" ? (
        <><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg> VOICE</>
      ) : (
        <><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> NOTE</>
      )}
    </span>
  );
}

// ─── AI result card ────────────────────────────────────────────────────────────
function JournalResultCard({ result, onClose }: { result: EvidenceResult; onClose: () => void }) {
  const { C } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#00D4AA", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace" }}>
          AI ANALYSIS
        </span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: C.tt, padding: 4, display: "flex", lineHeight: 1 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Personalized interpretation */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.07), rgba(0,184,148,0.04))",
        border: "1.5px solid rgba(0,212,170,0.22)",
        borderRadius: 14, padding: "16px 18px",
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#00D4AA", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
          FOR YOUR SITUATION
        </div>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8 }}>
          <CitedText text={result.personalized_interpretation} sources={result.sources ?? []} />
        </div>
      </div>

      {/* Practical steps */}
      {result.practical_steps?.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>
            ACTION STEPS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.practical_steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: "linear-gradient(135deg,#00D4AA,#00B894)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "#0A1628", fontFamily: "monospace",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: C.ts, lineHeight: 1.7 }}>
                  <CitedText text={step} sources={result.sources ?? []} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context fit */}
      {result.context_fit && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>
            CONTEXT MATCH
          </div>
          {result.context_fit.matches?.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: C.ts, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#00D4AA", flexShrink: 0, fontWeight: 800 }}>+</span>{m}
            </div>
          ))}
          {result.context_fit.track_next?.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "monospace", margin: "12px 0 8px" }}>
                TRACK NEXT
              </div>
              {result.context_fit.track_next.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: C.ts, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "#00D4AA", flexShrink: 0 }}>→</span>{t}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Literature toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none", border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "10px 14px", cursor: "pointer", fontSize: 12, color: C.tt,
          fontFamily: "monospace", textAlign: "left", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          letterSpacing: "0.05em",
        }}
      >
        <span>LITERATURE ({result.sources?.length ?? 0} sources)</span>
        <span style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", fontSize: 10 }}>▾</span>
      </button>

      {expanded && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 14, color: C.ts, lineHeight: 1.8, marginBottom: 12 }}>
            <CitedText text={result.evidence_summary} sources={result.sources ?? []} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.sources?.map((s, i) => (
              <div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 10, borderLeft: "2px solid rgba(0,212,170,0.3)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>[{i + 1}] {s.title}</div>
                <div style={{ fontSize: 11, color: C.tt, marginBottom: s.url ? 4 : 0 }}>{s.authors} · {s.year} · {s.journal}</div>
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#00D4AA", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}>
                    OPEN ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.safety_note && (
        <div style={{ background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.18)", borderRadius: 10, padding: "11px 14px", fontSize: 12, color: C.ts, lineHeight: 1.65 }}>
          <span style={{ fontWeight: 800, color: "#FF6B6B" }}>NOTE — </span>{result.safety_note}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface JournalScreenProps {
  profile: UserProfile | null;
}
type JournalView = "list" | "compose" | "ask";

export function JournalScreen({ profile }: JournalScreenProps) {
  const { C, isDark } = useTheme();
  const { isDesktop } = useBreakpoint();
  const [view, setView]       = useState<JournalView>("list");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Compose
  const [composeType, setComposeType]     = useState<"text" | "voice">("text");
  const [draftTitle, setDraftTitle]       = useState("");
  const [draftContent, setDraftContent]   = useState("");
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState("");

  // Voice
  const [isRecording, setIsRecording]             = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micSupported, setMicSupported]           = useState(true);
  const recognitionRef  = useRef<SpeechRecognitionInstance | null>(null);
  const isRecordingRef  = useRef(false);   // survives re-renders, used in onend closure
  const accumulatedRef  = useRef("");      // running final transcript, avoids stale closure

  // Ask AI
  const [aiQuery, setAiQuery]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<EvidenceResult | null>(null);
  const [aiError, setAiError]   = useState("");

  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)"  : "#E2E8F0";
  const monoFont    = "'Courier New', Courier, monospace";

  // Load entries
  useEffect(() => {
    fetch("/api/journal")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Check mic
  useEffect(() => {
    const SR = typeof window !== "undefined" &&
      ((window as unknown as Record<string, unknown>).SpeechRecognition ||
       (window as unknown as Record<string, unknown>).webkitSpeechRecognition);
    if (!SR) setMicSupported(false);
  }, []);

  // ── Voice ───────────────────────────────────────────────────────────────────
  // Creates a fresh SpeechRecognition instance wired to the shared refs.
  // Called both on initial start and on every auto-restart after a pause.
  const spawnRecognition = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new (SR as new () => SpeechRecognitionInstance)();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim   = "";
      let newFinal  = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) newFinal += (newFinal ? " " : "") + t;
        else interim += t;
      }
      if (newFinal) {
        accumulatedRef.current += (accumulatedRef.current ? " " : "") + newFinal;
        setDraftContent(accumulatedRef.current);
      }
      setInterimTranscript(interim);
    };

    rec.onend = () => {
      setInterimTranscript("");
      // If the user hasn't clicked Stop, the API ended due to a pause — restart.
      if (isRecordingRef.current) {
        try {
          const next = spawnRecognition();
          if (next) { recognitionRef.current = next; next.start(); }
        } catch {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    rec.onerror = (event: Event) => {
      const err = (event as { error?: string }).error;
      setInterimTranscript("");
      // "aborted" means we called stop() intentionally — don't restart.
      if (err === "aborted" || !isRecordingRef.current) {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
      // For "no-speech" etc. onend will fire next and handle the restart.
    };

    return rec;
  }, []); // no deps — reads refs directly, never stale

  const startRecording = useCallback(() => {
    accumulatedRef.current = draftContent; // start from any existing text
    isRecordingRef.current = true;
    const rec = spawnRecognition();
    if (!rec) return;
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [draftContent, spawnRecognition]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false; // tell onend not to restart
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimTranscript("");
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function saveEntry() {
    // Always stop mic first — prevents it staying active after save
    if (isRecordingRef.current) stopRecording();

    const content = draftContent.trim();
    if (!content) return;
    setSaving(true);
    setSaveError("");
    const title = draftTitle.trim() || autoTitle(content);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: composeType, title, content }),
      });
      const data = await res.json();
      if (data.error) {
        setSaveError(data.error);
      } else {
        setEntries(prev => [{
          id: data.id, type: composeType, title, content,
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setDraftTitle(""); setDraftContent("");
        accumulatedRef.current = "";
        if (!isDesktop) setView("list");
      }
    } catch {
      setSaveError("Could not save. Check your connection.");
    }
    setSaving(false);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function deleteEntry(id: string) {
    await fetch("/api/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  // ── Ask AI ──────────────────────────────────────────────────────────────────
  async function askAI(e: React.FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim() || entries.length === 0) return;
    setAiLoading(true); setAiError(""); setAiResult(null);
    const profileContext = profile
      ? Object.entries(profile).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ")
      : "";
    try {
      const res = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery, entries, profileContext }),
      });
      const data = await res.json();
      if (data.error) setAiError(data.error);
      else setAiResult(data);
    } catch { setAiError("Something went wrong. Please try again."); }
    setAiLoading(false);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // COMPOSE VIEW
  // ────────────────────────────────────────────────────────────────────────────
  if (view === "compose" && !isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui,-apple-system,sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Compose header */}
        <div style={{
          background: isDark ? "rgba(10,22,40,0.95)" : "rgba(240,253,250,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.borderLight}`,
          padding: "13px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <button
            onClick={() => { setView("list"); setDraftContent(""); setDraftTitle(""); stopRecording(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.ts, fontFamily: "inherit", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, padding: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Cancel
          </button>

          {/* Type toggle pills */}
          <div style={{ display: "flex", gap: 0, background: inputBg, borderRadius: 10, padding: 3, border: `1px solid ${inputBorder}` }}>
            {(["text", "voice"] as const).map(t => (
              <button key={t}
                onClick={() => { setComposeType(t); if (isRecording) stopRecording(); }}
                style={{
                  background: composeType === t
                    ? (t === "voice" ? "linear-gradient(135deg,#00D4AA,#00B894)" : isDark ? "rgba(255,255,255,0.12)" : "#FFF")
                    : "transparent",
                  color: composeType === t ? (t === "voice" ? "#0A1628" : C.text) : C.tt,
                  border: "none", borderRadius: 8, padding: "5px 14px",
                  cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                {t === "text"
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Note</>
                  : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>Voice</>
                }
              </button>
            ))}
          </div>

          <button
            onClick={saveEntry}
            disabled={saving || !draftContent.trim()}
            style={{
              background: draftContent.trim()
                ? "linear-gradient(135deg,#00D4AA,#00B894)"
                : isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0",
              border: "none", borderRadius: 10, padding: "8px 18px",
              color: draftContent.trim() ? "#0A1628" : C.tt,
              fontSize: 13, fontWeight: 800, cursor: saving || !draftContent.trim() ? "default" : "pointer",
              fontFamily: "inherit", transition: "all 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Save error */}
        {saveError && (
          <div style={{ background: "rgba(255,107,107,0.1)", borderBottom: "1px solid rgba(255,107,107,0.2)", padding: "10px 18px", fontSize: 13, color: "#FF6B6B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{saveError}</span>
            <button onClick={() => setSaveError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B6B", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Compose body */}
        <div style={{ flex: 1, padding: "24px 22px 40px", display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Date stamp */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#00D4AA", letterSpacing: "0.15em", fontFamily: monoFont, marginBottom: 16 }}>
            {formatDateStamp(new Date().toISOString())} — {formatTimeStamp(new Date().toISOString())}
          </div>

          {/* Title input */}
          <input
            placeholder="Entry title"
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "inherit",
              width: "100%", marginBottom: 16, lineHeight: 1.2,
            }}
          />

          {/* Divider */}
          <div style={{ height: 1, background: C.borderLight, marginBottom: 20 }} />

          {/* Text compose */}
          {composeType === "text" && (
            <textarea
              autoFocus
              placeholder={"Describe your workouts, nutrition, sleep, symptoms, how you felt...\n\nThe more specific you are, the better the AI can apply research to your situation."}
              value={draftContent}
              onChange={e => { setDraftContent(e.target.value); accumulatedRef.current = e.target.value; }}
              style={{
                background: "transparent", border: "none", outline: "none",
                fontSize: 15, color: C.text, fontFamily: "inherit",
                lineHeight: 1.85, minHeight: "55vh", resize: "none", width: "100%",
              }}
            />
          )}

          {/* Voice compose */}
          {composeType === "voice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center" }}>
              {!micSupported && (
                <p style={{ fontSize: 13, color: C.error, margin: 0 }}>
                  Voice is not supported in this browser. Try Chrome or Safari.
                </p>
              )}

              {micSupported && (
                <>
                  {/* Record button */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 24 }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isRecording && (
                        <>
                          <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", border: "2px solid rgba(0,212,170,0.3)", animation: "recordPulse 1.4s ease-out infinite" }} />
                          <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(0,212,170,0.15)", animation: "recordPulse 1.4s ease-out 0.4s infinite" }} />
                        </>
                      )}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        style={{
                          width: 80, height: 80, borderRadius: "50%",
                          background: isRecording
                            ? "linear-gradient(135deg,#FF6B6B,#EF4444)"
                            : "linear-gradient(135deg,#00D4AA,#00B894)",
                          border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: isRecording
                            ? "0 0 32px rgba(255,107,107,0.35), 0 4px 20px rgba(0,0,0,0.4)"
                            : "0 0 32px rgba(0,212,170,0.25), 0 4px 20px rgba(0,0,0,0.3)",
                          transition: "all 0.25s",
                          position: "relative", zIndex: 1,
                        }}
                      >
                        {isRecording ? (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="6" width="12" height="12" rx="2"/>
                          </svg>
                        ) : (
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      {isRecording && <WaveBars active color="#00D4AA" />}
                      <p style={{ margin: 0, fontSize: 12, color: isRecording ? "#00D4AA" : C.tt, fontFamily: monoFont, letterSpacing: "0.08em", fontWeight: 700 }}>
                        {isRecording ? "RECORDING — TAP TO STOP" : "TAP TO BEGIN SPEAKING"}
                      </p>
                    </div>
                  </div>

                  {/* Live interim */}
                  {interimTranscript && (
                    <p style={{ margin: 0, fontSize: 14, color: C.tt, fontStyle: "italic", textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>
                      {interimTranscript}
                    </p>
                  )}

                  {/* Editable transcript */}
                  {draftContent && (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 1, flex: 1, background: C.borderLight }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", fontFamily: monoFont }}>TRANSCRIPT</span>
                        <div style={{ height: 1, flex: 1, background: C.borderLight }} />
                      </div>
                      <textarea
                        value={draftContent}
                        onChange={e => { setDraftContent(e.target.value); accumulatedRef.current = e.target.value; }}
                        style={{
                          background: inputBg, border: `1px solid ${inputBorder}`,
                          borderRadius: 14, padding: "14px 16px",
                          fontSize: 14, color: C.text, fontFamily: "inherit",
                          lineHeight: 1.8, minHeight: 140, resize: "vertical",
                          width: "100%", boxSizing: "border-box", outline: "none",
                        }}
                      />
                      <p style={{ margin: 0, fontSize: 11, color: C.tt, fontFamily: monoFont }}>
                        Edit transcript before saving.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes recordPulse {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes waveBounce {
            from { transform: scaleY(0.5); }
            to { transform: scaleY(1.4); }
          }
        `}</style>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LIST VIEW  (mobile: single column | desktop: two-column split)
  // ────────────────────────────────────────────────────────────────────────────

  // On desktop, show the compose panel alongside the list
  const showDesktopCompose = isDesktop && view === "compose";
  const showDesktopAsk     = isDesktop && view === "ask";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui,-apple-system,sans-serif", display: isDesktop ? "flex" : "block", alignItems: "flex-start" }}>

      {/* ── Left panel (list) ── */}
      <div style={{
        width: isDesktop ? 360 : "100%",
        flexShrink: 0,
        borderRight: isDesktop ? `1px solid ${C.borderLight}` : "none",
        minHeight: isDesktop ? "100vh" : undefined,
        overflowY: isDesktop ? "auto" : undefined,
        paddingBottom: isDesktop ? 40 : 100,
      }}>

      {/* Header */}
      <div style={{
        padding: "28px 20px 20px",
        borderBottom: `1px solid ${C.borderLight}`,
        background: isDark
          ? "linear-gradient(180deg, rgba(0,212,170,0.04) 0%, transparent 100%)"
          : "linear-gradient(180deg, rgba(0,212,170,0.06) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00D4AA", letterSpacing: "0.18em", fontFamily: monoFont, marginBottom: 5 }}>
              HEALTH JOURNAL
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              Field Notes
            </h2>
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => { setView("ask"); setAiResult(null); setAiError(""); setAiQuery(""); }}
              style={{
                background: "linear-gradient(135deg,#00D4AA,#00B894)",
                border: "none", borderRadius: 12, padding: "10px 16px",
                color: "#0A1628", fontSize: 12, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
                letterSpacing: "0.02em", flexShrink: 0,
                boxShadow: "0 4px 16px rgba(0,212,170,0.25)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Ask AI
            </button>
          )}
        </div>

        {entries.length > 0 && (
          <p style={{ margin: 0, fontSize: 12, color: C.tt, fontFamily: monoFont, letterSpacing: "0.04em" }}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"} — contextualized AI analysis available
          </p>
        )}
      </div>

      <div style={{ padding: "18px 18px 0", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* New entry row */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setComposeType("text"); setDraftContent(""); setDraftTitle(""); setView("compose"); }}
            style={{
              flex: 1, background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 14, padding: "14px 16px",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 9,
              fontSize: 13, fontWeight: 600, color: C.ts,
              transition: "border-color 0.15s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Write a note
          </button>
          <button
            onClick={() => { setComposeType("voice"); setDraftContent(""); setDraftTitle(""); setView("compose"); }}
            style={{
              flex: 1, background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 14, padding: "14px 16px",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 9,
              fontSize: 13, fontWeight: 600, color: C.ts,
              transition: "border-color 0.15s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Voice memo
          </button>
        </div>

        {/* Ask AI panel — only shown inline on mobile */}
        {view === "ask" && !isDesktop && (
          <div style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(0,212,170,0.06), rgba(0,184,148,0.03))"
              : "linear-gradient(135deg, rgba(0,212,170,0.07), rgba(240,253,250,1))",
            border: "1.5px solid rgba(0,212,170,0.28)",
            borderRadius: 18, padding: "20px 18px",
            boxShadow: "0 8px 32px rgba(0,212,170,0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#00D4AA", letterSpacing: "0.14em", fontFamily: monoFont, marginBottom: 4 }}>
                  AI CONSULTATION
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>
                  Ask about your journal
                </p>
              </div>
              <button
                onClick={() => { setView("list"); setAiResult(null); setAiError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.tt, padding: 4, display: "flex", lineHeight: 1 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: 12, color: C.ts, lineHeight: 1.65, fontFamily: monoFont }}>
              {entries.length} {entries.length === 1 ? "entry" : "entries"} loaded as context.
              Ask broadly — the AI maximizes practical application using your specific data.
            </p>

            {!aiResult && !aiLoading && (
              <form onSubmit={askAI} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  autoFocus
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder="e.g. How can I reduce DOMS after leg workouts?"
                  style={{
                    background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.8)",
                    border: `1px solid ${inputBorder}`,
                    borderRadius: 12, padding: "13px 16px",
                    color: C.text, fontSize: 14, outline: "none",
                    fontFamily: "inherit", width: "100%", boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim()}
                  style={{
                    background: aiQuery.trim()
                      ? "linear-gradient(135deg,#00D4AA,#00B894)"
                      : isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0",
                    border: "none", borderRadius: 12, padding: "13px",
                    color: aiQuery.trim() ? "#0A1628" : C.tt,
                    fontSize: 13, fontWeight: 800, cursor: aiQuery.trim() ? "pointer" : "default",
                    fontFamily: "inherit", transition: "all 0.2s", width: "100%",
                  }}
                >
                  Search with Journal Context
                </button>
              </form>
            )}

            {aiLoading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "28px 0" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(0,212,170,0.15)", borderTopColor: "#00D4AA", animation: "spin 0.75s linear infinite" }} />
                <p style={{ margin: 0, fontSize: 11, color: C.ts, fontFamily: monoFont, letterSpacing: "0.06em" }}>
                  SEARCHING LITERATURE + APPLYING JOURNAL CONTEXT...
                </p>
              </div>
            )}

            {aiError && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: C.error }}>{aiError}</p>
                <button
                  onClick={() => { setAiError(""); setAiResult(null); }}
                  style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", cursor: "pointer", fontSize: 12, color: C.ts, fontFamily: "inherit", alignSelf: "flex-start" }}
                >
                  Try again
                </button>
              </div>
            )}

            {aiResult && (
              <JournalResultCard result={aiResult} onClose={() => { setAiResult(null); setAiQuery(""); }} />
            )}
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: inputBg, borderRadius: 16, height: 88, animation: "shimmer 1.4s ease-in-out infinite", opacity: 0.5 }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            {/* CitedMark watermark */}
            <div style={{ position: "relative" }}>
              <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.12 }}>
                <rect x="31.5" y="0" width="37" height="100" rx="10" fill="#00D4AA"/>
                <rect x="0" y="31.5" width="100" height="37" rx="10" fill="#00D4AA"/>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-0.3px" }}>
                Start your field notes
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.ts, lineHeight: 1.7 }}>
                Log workouts, nutrition, sleep, and symptoms. The AI reads your entries and applies research directly to your situation.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ padding: "7px 13px", borderRadius: 8, background: isDark ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", fontSize: 11, color: "#00D4AA", fontFamily: monoFont, letterSpacing: "0.07em" }}>
                WORKOUT LOG
              </div>
              <div style={{ padding: "7px 13px", borderRadius: 8, background: isDark ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", fontSize: 11, color: "#00D4AA", fontFamily: monoFont, letterSpacing: "0.07em" }}>
                NUTRITION
              </div>
              <div style={{ padding: "7px 13px", borderRadius: 8, background: isDark ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", fontSize: 11, color: "#00D4AA", fontFamily: monoFont, letterSpacing: "0.07em" }}>
                SLEEP
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  background: C.surface,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  transition: "border-color 0.15s",
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  width: 3, flexShrink: 0,
                  background: entry.type === "voice"
                    ? "linear-gradient(180deg,#00D4AA,#00B894)"
                    : isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                }} />

                <div style={{ flex: 1, padding: "14px 14px 14px 13px" }}>
                  {/* Top row: badge + timestamp + delete */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <EntryBadge type={entry.type} />
                      <span style={{ fontSize: 10, color: C.tt, fontFamily: monoFont, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                        {formatDateStamp(entry.createdAt)} {formatTimeStamp(entry.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => entry.id && deleteEntry(entry.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.tt, padding: 4, display: "flex", flexShrink: 0, opacity: 0.6 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>

                  {/* Title */}
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
                    {entry.title || autoTitle(entry.content)}
                  </p>

                  {/* Voice: show wave bars decoration */}
                  {entry.type === "voice" && (
                    <div style={{ marginBottom: 6 }}>
                      <WaveBars color="#00D4AA" />
                    </div>
                  )}

                  {/* Content preview */}
                  <p style={{
                    margin: 0, fontSize: 12, color: C.ts, lineHeight: 1.65,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {entry.content}
                  </p>

                  {/* Entry index stamp */}
                  <div style={{ marginTop: 8, fontSize: 9, color: C.tt, fontFamily: monoFont, letterSpacing: "0.1em" }}>
                    LOG-{String(entries.length - idx).padStart(3, "0")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{/* end entries/padding div */}
      </div>{/* end left panel */}

      {/* ── Right panel (desktop only): compose or ask AI ── */}
      {isDesktop && (
        <div style={{ flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {(view === "compose" || view === "list") && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Compose header */}
              <div style={{
                background: isDark ? "rgba(10,22,40,0.95)" : "rgba(240,253,250,0.95)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${C.borderLight}`,
                padding: "16px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                position: "sticky", top: 0, zIndex: 10,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", fontFamily: monoFont }}>
                  {view === "compose" ? (composeType === "voice" ? "VOICE MEMO" : "NEW NOTE") : "NEW NOTE"}
                </div>
                <div style={{ display: "flex", gap: 0, background: inputBg, borderRadius: 10, padding: 3, border: `1px solid ${inputBorder}` }}>
                  {(["text", "voice"] as const).map(t => (
                    <button key={t}
                      onClick={() => { setComposeType(t); setView("compose"); if (isRecording) stopRecording(); }}
                      style={{
                        background: composeType === t && view === "compose"
                          ? (t === "voice" ? "linear-gradient(135deg,#00D4AA,#00B894)" : isDark ? "rgba(255,255,255,0.12)" : "#FFF")
                          : "transparent",
                        color: composeType === t && view === "compose" ? (t === "voice" ? "#0A1628" : C.text) : C.tt,
                        border: "none", borderRadius: 8, padding: "5px 14px",
                        cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {t === "text" ? "Note" : "Voice"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={saveEntry}
                  disabled={saving || !draftContent.trim()}
                  style={{
                    background: draftContent.trim() ? "linear-gradient(135deg,#00D4AA,#00B894)" : isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0",
                    border: "none", borderRadius: 10, padding: "8px 20px",
                    color: draftContent.trim() ? "#0A1628" : C.tt,
                    fontSize: 13, fontWeight: 800,
                    cursor: saving || !draftContent.trim() ? "default" : "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving..." : "Save entry"}
                </button>
              </div>

              {saveError && (
                <div style={{ background: "rgba(255,107,107,0.1)", borderBottom: "1px solid rgba(255,107,107,0.2)", padding: "10px 24px", fontSize: 13, color: "#FF6B6B", display: "flex", justifyContent: "space-between" }}>
                  <span>{saveError}</span>
                  <button onClick={() => setSaveError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B6B" }}>×</button>
                </div>
              )}

              {/* Compose body */}
              <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00D4AA", letterSpacing: "0.15em", fontFamily: monoFont, marginBottom: 18 }}>
                  {formatDateStamp(new Date().toISOString())} — {formatTimeStamp(new Date().toISOString())}
                </div>
                <input
                  placeholder="Entry title"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: 28, fontWeight: 800, color: C.text, fontFamily: "inherit", width: "100%", marginBottom: 18, lineHeight: 1.2 }}
                />
                <div style={{ height: 1, background: C.borderLight, marginBottom: 22 }} />

                {composeType === "text" && (
                  <textarea
                    autoFocus={view === "compose"}
                    placeholder={"Describe your workouts, nutrition, sleep, symptoms, how you felt...\n\nThe more specific you are, the better the AI can apply research to your situation."}
                    value={draftContent}
                    onChange={e => { setDraftContent(e.target.value); accumulatedRef.current = e.target.value; }}
                    style={{ background: "transparent", border: "none", outline: "none", fontSize: 16, color: C.text, fontFamily: "inherit", lineHeight: 1.85, flex: 1, resize: "none", width: "100%", minHeight: "50vh" }}
                  />
                )}

                {composeType === "voice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", paddingTop: 32 }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isRecording && (
                        <><div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", border: "2px solid rgba(0,212,170,0.3)", animation: "recordPulse 1.4s ease-out infinite" }} />
                        <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(0,212,170,0.15)", animation: "recordPulse 1.4s ease-out 0.4s infinite" }} /></>
                      )}
                      <button onClick={isRecording ? stopRecording : startRecording}
                        style={{ width: 80, height: 80, borderRadius: "50%", background: isRecording ? "linear-gradient(135deg,#FF6B6B,#EF4444)" : "linear-gradient(135deg,#00D4AA,#00B894)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isRecording ? "0 0 32px rgba(255,107,107,0.35)" : "0 0 32px rgba(0,212,170,0.25)", position: "relative", zIndex: 1 }}>
                        {isRecording ? <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                          : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                      </button>
                    </div>
                    {isRecording && <WaveBars active color="#00D4AA" />}
                    <p style={{ margin: 0, fontSize: 12, color: isRecording ? "#00D4AA" : C.tt, fontFamily: monoFont, letterSpacing: "0.08em", fontWeight: 700 }}>
                      {isRecording ? "RECORDING — CLICK TO STOP" : "CLICK TO SPEAK"}
                    </p>
                    {interimTranscript && <p style={{ margin: 0, fontSize: 14, color: C.tt, fontStyle: "italic", textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>{interimTranscript}</p>}
                    {draftContent && (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ height: 1, flex: 1, background: C.borderLight }} />
                          <span style={{ fontSize: 9, fontWeight: 800, color: C.tt, letterSpacing: "0.14em", fontFamily: monoFont }}>TRANSCRIPT</span>
                          <div style={{ height: 1, flex: 1, background: C.borderLight }} />
                        </div>
                        <textarea value={draftContent} onChange={e => { setDraftContent(e.target.value); accumulatedRef.current = e.target.value; }}
                          style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 14, padding: "14px 16px", fontSize: 15, color: C.text, fontFamily: "inherit", lineHeight: 1.8, minHeight: 160, resize: "vertical", width: "100%", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "ask" && (
            <div style={{ flex: 1, padding: "32px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#00D4AA", letterSpacing: "0.14em", fontFamily: monoFont, marginBottom: 6 }}>AI CONSULTATION</div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.3px" }}>Ask about your journal</h3>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: C.ts, lineHeight: 1.65, fontFamily: monoFont }}>
                  {entries.length} {entries.length === 1 ? "entry" : "entries"} loaded as context. Ask broadly — the AI maximizes practical application using your specific data.
                </p>
              </div>
              {!aiResult && !aiLoading && (
                <form onSubmit={askAI} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input autoFocus type="text" value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                    placeholder="e.g. How can I reduce DOMS after leg workouts?"
                    style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 14, padding: "15px 18px", color: C.text, fontSize: 16, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
                  <button type="submit" disabled={!aiQuery.trim()}
                    style={{ background: aiQuery.trim() ? "linear-gradient(135deg,#00D4AA,#00B894)" : isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0", border: "none", borderRadius: 12, padding: "15px", color: aiQuery.trim() ? "#0A1628" : C.tt, fontSize: 14, fontWeight: 800, cursor: aiQuery.trim() ? "pointer" : "default", fontFamily: "inherit", width: "100%" }}>
                    Search with Journal Context
                  </button>
                </form>
              )}
              {aiLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(0,212,170,0.15)", borderTopColor: "#00D4AA", animation: "spin 0.75s linear infinite" }} />
                  <p style={{ margin: 0, fontSize: 11, color: C.ts, fontFamily: monoFont, letterSpacing: "0.06em" }}>SEARCHING LITERATURE + APPLYING JOURNAL CONTEXT...</p>
                </div>
              )}
              {aiError && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 14, color: C.error }}>{aiError}</p>
                  <button onClick={() => { setAiError(""); setAiResult(null); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9, padding: "9px 16px", cursor: "pointer", fontSize: 13, color: C.ts, fontFamily: "inherit", alignSelf: "flex-start" }}>Try again</button>
                </div>
              )}
              {aiResult && <JournalResultCard result={aiResult} onClose={() => { setAiResult(null); setAiQuery(""); }} />}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes waveBounce {
          from { transform: scaleY(0.5); }
          to { transform: scaleY(1.4); }
        }
        @keyframes recordPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
