"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon, IDs } from "@/components/ui/Icons";
import { Dots, EvBadge, Badge, VerifiedBadge, DbBadge, StudyTypeBadge } from "@/components/ui/Badges";
import { CitedText } from "@/components/ui/CitedText";
import { CITEDListen } from "@/components/ui/CITEDListen";
import { ShareSheet } from "@/components/ui/ShareSheet";
import { useTheme } from "@/lib/theme";
import { Collapse } from "@/components/ui/Collapse";
import type { EvidenceResult, ContextQuestion, Source, UserProfile } from "@/types";

interface TermDef { term: string; definition: string; }

interface ResultsScreenProps {
  query: string;
  answers: Record<string, string>;
  questions: ContextQuestion[] | null;
  profile: UserProfile | null;
  onBack: () => void;
  onHome: () => void;
  onSave: (item: { query: string; answers: Record<string, string>; result: EvidenceResult; savedAt: string }) => void;
  isGuest?: boolean;
  onSelectPlan?: () => void;
}

function stripCites(text: string) {
  return text.replace(/\[(\d+(?:\s*[,\s]\s*\d+)*)\]/g, "").replace(/\s{2,}/g, " ").trim();
}

function buildSpeechText(query: string, r: EvidenceResult) {
  const parts = [
    `Here's what the research says about ${query}.`,
    stripCites(r.evidence_summary || ""),
    "Now, how this applies specifically to you.",
    stripCites(r.personalized_interpretation || ""),
  ];
  if (r.practical_steps?.length) {
    parts.push("Here are your practical next steps.");
    r.practical_steps.forEach((s, i) => parts.push(`Step ${i + 1}. ${stripCites(s)}`));
  }
  if (r.safety_note) parts.push(`One important note. ${stripCites(r.safety_note)}`);
  parts.push(`This analysis was based on ${r.sources?.length ?? 0} verified peer-reviewed sources.`);
  return parts.join(" ");
}

export function ResultsScreen({ query, answers, questions, profile, onBack, onHome, onSave, isGuest, onSelectPlan }: ResultsScreenProps) {
  const { C } = useTheme();
  const [result, setResult] = useState<EvidenceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("Searching medical databases...");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [exp, setExp] = useState<Record<string, boolean>>({});
  const [showShare, setShowShare] = useState(false);
  const [defTerms, setDefTerms] = useState<TermDef[] | null>(null);
  const [defOpen, setDefOpen] = useState(false);
  const cancelled = useRef(false);

  function toggle(k: string) {
    setExp((e) => ({ ...e, [k]: !e[k] }));
  }

  const profileLines: string[] = [];
  if (profile) {
    if (profile.ageRange) profileLines.push(`Age: ${profile.ageRange}`);
    if (profile.sex) profileLines.push(`Sex: ${profile.sex}`);
    if (profile.activityLevel) profileLines.push(`Activity level: ${profile.activityLevel}`);
    if (profile.goals) profileLines.push(`Primary goal: ${profile.goals}`);
    if (profile.dietPattern) profileLines.push(`Diet: ${profile.dietPattern}`);
    if (profile.sleepQuality) profileLines.push(`Sleep quality: ${profile.sleepQuality}`);
    if (profile.healthConditions) profileLines.push(`Health conditions: ${profile.healthConditions}`);
    if (profile.supplements) profileLines.push(`Supplements: ${profile.supplements}`);
  }
  const profileCtx = profileLines.length ? `USER PROFILE:\n${profileLines.join("\n")}` : "";
  const questionCtx = questions
    ? questions.map((q) => `${q.text}: ${answers[q.id] || "N/A"}`).join("\n")
    : "";
  const ctx = [profileCtx, questionCtx].filter(Boolean).join("\n\n");

  useEffect(() => {
    cancelled.current = false;
    setLoading(true);

    async function run() {
      try {
        setPhase("Searching medical databases...");
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, context: ctx }),
        });
        const searchData = await searchRes.json();
        if (cancelled.current) return;

        if (searchData.error || !searchData.sources?.length) {
          setResult({ insufficient: true, sourceCount: 0, sources: [] } as unknown as EvidenceResult);
          setLoading(false);
          return;
        }

        const sources: Source[] = searchData.sources;

        if (sources.length < 2) {
          setResult({ insufficient: true, sourceCount: sources.length, sources } as unknown as EvidenceResult);
          setLoading(false);
          return;
        }

        setPhase(`Found ${sources.length} papers. Analyzing...`);

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sources, context: ctx }),
        });
        const analysisData = await analyzeRes.json();
        if (cancelled.current) return;

        if (analysisData.error) throw new Error(analysisData.error);
        setResult(analysisData);

        // Fetch definitions in background — don't block result display
        const defText = [
          analysisData.evidence_summary,
          analysisData.personalized_interpretation,
          ...(analysisData.practical_steps ?? []),
        ].filter(Boolean).join(" ");
        fetch("/api/definitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: defText }),
        })
          .then(r => r.json())
          .then(d => { if (!cancelled.current) setDefTerms(d.terms ?? []); })
          .catch(() => {});
      } catch (e) {
        if (!cancelled.current) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    }

    run();
    return () => { cancelled.current = true; };
  }, [query, ctx]);

  function doSave() {
    if (!saved && result && !(result as unknown as { insufficient: boolean }).insufficient) {
      onSave({ query, answers, result, savedAt: new Date().toISOString() });
      setSaved(true);
    }
  }

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30 }}>
        <div style={{ width: 70, height: 70, borderRadius: 20, background: "linear-gradient(135deg,#0A1628,#132040)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 4px 24px rgba(0,212,170,0.3)" }}>
          <span style={{ fontSize: 34, fontWeight: 900, color: "#00D4AA", fontFamily: "inherit" }}>✚</span>
        </div>
        <Dots />
        <p style={{ color: C.ts, fontSize: 15, marginTop: 16, textAlign: "center" }}>{phase}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon d={IDs.back} size={22} color={C.primary} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Error</h2>
        </div>
        <div style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: C.error, fontSize: 15, margin: "16px 0" }}>{error}</p>
          <button onClick={onBack} style={{ background: C.primary, color: "white", border: "none", borderRadius: 12, padding: "12px 28px", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const r = result as unknown as EvidenceResult & { insufficient?: boolean; sourceCount?: number };

  // Insufficient / "We don't know yet"
  if (r.insufficient) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon d={IDs.back} size={22} color={C.primary} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Results</h2>
        </div>
        <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg,${C.primaryDeep},#1E3A5F)`, borderRadius: 16, padding: "20px 18px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔬</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px", fontFamily: "inherit" }}>We Don't Know Yet</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
              Only {r.sourceCount ?? 0} peer-reviewed source{(r.sourceCount ?? 0) !== 1 ? "s" : ""} found. CITED requires at least 2 verified papers before presenting an evidence summary.
            </p>
          </div>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>What this means:</div>
            {[
              { icon: "✅", label: "What's known", text: "A small number of studies may exist, but not enough to draw reliable conclusions." },
              { icon: "?", label: "What's unknown", text: "The research community may not have studied this topic enough, or evidence may be conflicting." },
              { icon: "📋", label: "How to monitor", text: "Try a more specific search, or check back as new research is published regularly." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.ts, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: C.ts, lineHeight: 1.5 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: C.accentLight, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.accent}40`, fontSize: 12, color: C.ts, lineHeight: 1.5 }}>
            <strong>Try rephrasing:</strong> Broader or more common queries tend to yield more peer-reviewed literature.
          </div>
          <button onClick={onBack} style={{ background: C.primary, color: "white", border: "none", borderRadius: 12, padding: "14px 28px", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Try Different Search</button>
        </div>
      </div>
    );
  }

  const verifiedCount = r.sources?.filter((s) => s.verified).length ?? 0;
  const speechText = buildSpeechText(query, r);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100 }}>
      {showShare && (
        <ShareSheet query={query} evidenceSummary={r.evidence_summary} personalSummary={r.personalized_interpretation} sources={r.sources ?? []} onClose={() => setShowShare(false)} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon d={IDs.back} size={22} color={C.primary} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Results</h2>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isGuest ? (
            <button onClick={onSelectPlan} style={{ background: C.primary, border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: "white", fontSize: 13, fontWeight: 700 }}>
              Select Plan
            </button>
          ) : (
            <>
              <button onClick={() => setShowShare(true)} style={{ background: `${C.primary}12`, border: `1.5px solid ${C.primary}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.primary, fontSize: 13, fontWeight: 600 }}>
                <Icon d={IDs.share} size={14} color={C.primary} /> Share
              </button>
              <button onClick={doSave} style={{ background: saved ? `${C.success}15` : C.surfaceAlt, border: `1.5px solid ${saved ? C.success : C.border}`, borderRadius: 10, padding: "7px 12px", cursor: saved ? "default" : "pointer", color: saved ? C.success : C.ts, fontSize: 13, fontWeight: 600 }}>
                {saved ? "✓ Saved" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Hero */}
        <div style={{ background: `linear-gradient(135deg,${C.primaryDeep},${C.primaryDark})`, borderRadius: 16, padding: "18px 16px", color: "white" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Your search</div>
          <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "inherit", marginBottom: 10, lineHeight: 1.3 }}>{query}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <EvBadge level={r.evidence_quality?.level ?? "Moderate"} />
            <Badge color="white" bg="rgba(255,255,255,0.15)">{verifiedCount} verified sources</Badge>
          </div>
          {r.context_fit?.matches?.length > 0 && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>🎯</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Population Match</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>{r.context_fit.matches[0]}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dr. CITED Listen */}
        <CITEDListen text={speechText} query={query} />

        {/* Definition Bank */}
        {(defTerms === null || defTerms.length > 0) && (
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <button
              onClick={() => setDefOpen(o => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "15px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h7M2 11h5" stroke="#00D4AA" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Definition Bank</span>
                  {defTerms === null
                    ? <span style={{ fontSize: 11, color: C.tt, marginLeft: 8 }}>Loading terms…</span>
                    : <span style={{ fontSize: 11, color: C.tt, marginLeft: 8 }}>{defTerms.length} terms defined</span>
                  }
                </div>
              </div>
              <svg
                width="18" height="18" viewBox="0 0 18 18" fill="none"
                style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: defOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
              >
                <path d="M4 6.5L9 11.5L14 6.5" stroke={C.tt} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <Collapse open={defOpen}>
              <div style={{ padding: "0 18px 16px" }}>
                {defTerms === null ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ borderRadius: 10, background: C.surfaceAlt, padding: "12px 14px" }}>
                        <div style={{ height: 12, width: "40%", borderRadius: 6, background: C.border, marginBottom: 8 }} />
                        <div style={{ height: 10, width: "85%", borderRadius: 6, background: C.border, marginBottom: 4 }} />
                        <div style={{ height: 10, width: "65%", borderRadius: 6, background: C.border }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {defTerms.map((t, i) => (
                      <div key={i} style={{ borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.borderLight}`, padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginBottom: 4 }}>{t.term}</div>
                        <div style={{ fontSize: 13, color: C.ts, lineHeight: 1.6 }}>{t.definition}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Collapse>
          </div>
        )}

        {/* Evidence summary */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon d={IDs.bar} size={16} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>What the Evidence Says</span>
          </div>
          <div style={{ fontSize: 14, color: C.ts, lineHeight: 1.75 }}>
            <CitedText text={r.evidence_summary} sources={r.sources ?? []} />
          </div>
        </div>

        {/* Personalized */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1.5px solid ${C.primary}40`, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon d={IDs.target} size={16} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.primaryDark }}>How This Applies to You</span>
          </div>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.75 }}>
            <CitedText text={r.personalized_interpretation} sources={r.sources ?? []} />
          </div>
        </div>

        {/* Context fit */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <button onClick={() => toggle("fit")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={IDs.eye} size={16} color={C.accent} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Context Fit</span>
            </div>
            <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: exp.fit ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          <Collapse open={!!exp.fit}>
            <div style={{ marginTop: 14 }}>
              {r.context_fit?.matches?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.success, marginBottom: 6 }}>✅ Matches</div>
                  {r.context_fit.matches.map((m, i) => <p key={i} style={{ fontSize: 13, color: C.ts, margin: "0 0 4px", paddingLeft: 8, borderLeft: `2px solid ${C.success}30`, lineHeight: 1.5 }}>{m}</p>)}
                </div>
              )}
              {r.context_fit?.gaps?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>⚠️ Gaps</div>
                  {r.context_fit.gaps.map((m, i) => <p key={i} style={{ fontSize: 13, color: C.ts, margin: "0 0 4px", paddingLeft: 8, borderLeft: "2px solid #F59E0B30", lineHeight: 1.5 }}>{m}</p>)}
                </div>
              )}
              {r.context_fit?.track_next?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6 }}>Track This Week</div>
                  {r.context_fit.track_next.map((m, i) => <p key={i} style={{ fontSize: 13, color: C.ts, margin: "0 0 4px", paddingLeft: 8, borderLeft: `2px solid ${C.primary}30`, lineHeight: 1.5 }}>{m}</p>)}
                </div>
              )}
            </div>
          </Collapse>
        </div>

        {/* Evidence quality */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <button onClick={() => toggle("q")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={IDs.shield} size={16} color={C.success} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Evidence Quality</span>
            </div>
            <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: exp.q ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          <Collapse open={!!exp.q}>
            <div style={{ marginTop: 12 }}>
              <EvBadge level={r.evidence_quality?.level ?? "Moderate"} />
              <p style={{ fontSize: 13, color: C.ts, margin: "10px 0 0", lineHeight: 1.6 }}>{r.evidence_quality?.explanation}</p>
            </div>
          </Collapse>
        </div>

        {/* Practical steps */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon d={IDs.zap} size={16} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Practical Next Steps</span>
          </div>
          {r.practical_steps?.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: C.primaryLight, color: C.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                <CitedText text={s} sources={r.sources ?? []} />
              </div>
            </div>
          ))}
        </div>

        {/* Sources */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <button onClick={() => toggle("src")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={IDs.book} size={16} color={C.primary} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Sources ({r.sources?.length ?? 0})</span>
            </div>
            <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: exp.src ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          <Collapse open={!!exp.src}>
            <div style={{ marginTop: 12 }}>
              {r.sources?.map((s, i) => (
                <div key={i} style={{ padding: 12, background: C.surfaceAlt, borderRadius: 10, border: `1px solid ${C.borderLight}`, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 22, height: 22, borderRadius: 11, background: C.primary, color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{s.title}</div>
                    </div>
                    {s.verified && <VerifiedBadge />}
                  </div>
                  <div style={{ fontSize: 11, color: C.tt, marginBottom: 4, paddingLeft: 30 }}>{s.authors} · {s.year} · {s.journal}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingLeft: 30 }}>
                    {s.source_db && <DbBadge db={s.source_db} />}
                    {s.type && <StudyTypeBadge type={s.type} />}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>Open ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          </Collapse>
        </div>

        {/* Safety note */}
        <div style={{ background: C.accentLight, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.accent}30`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon d={IDs.info} size={16} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 12, color: C.ts, margin: "0 0 6px", lineHeight: 1.5 }}>{r.safety_note ?? "For educational purposes. Always consult a healthcare professional."}</p>
            <p style={{ fontSize: 11, color: C.tt, margin: 0, lineHeight: 1.5 }}><strong>Not medical advice.</strong> Talk to a qualified healthcare professional before making changes to your health regimen.</p>
          </div>
        </div>

        {isGuest ? (
          <div style={{ marginTop: 4, background: `linear-gradient(135deg,${C.primaryDeep},#0F2A4A)`, borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 6, fontFamily: "inherit" }}>You've used your free preview</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 16, lineHeight: 1.5 }}>Create an account to save results, search again, and unlock full personalized analysis.</div>
            <button onClick={onSelectPlan} style={{ width: "100%", background: C.primary, border: "none", borderRadius: 12, padding: "14px 0", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "white" }}>
              Select a Plan
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onHome} style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: C.text }}>New Search</button>
            <button onClick={() => setShowShare(true)} style={{ flex: 1, background: C.primary, border: "none", borderRadius: 12, padding: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon d={IDs.share} size={16} color="white" /> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
