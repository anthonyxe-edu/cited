"use client";

import React, { useState, useEffect } from "react";
import { Icon, IDs } from "@/components/ui/Icons";
import { Dots } from "@/components/ui/Badges";
import { useTheme } from "@/lib/theme";
import type { ContextQuestion, UserProfile } from "@/types";

interface ContextScreenProps {
  query: string;
  profile: UserProfile | null;
  onSubmit: (answers: Record<string, string>, questions: ContextQuestion[]) => void;
  onBack: () => void;
}

export function ContextScreen({ query, profile, onSubmit, onBack }: ContextScreenProps) {
  const { C } = useTheme();
  const [questions, setQuestions] = useState<ContextQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, profile }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions);
        const pf: Record<string, string> = {};
        data.questions.forEach((q: ContextQuestion) => {
          if (q.prefill) pf[q.id] = q.prefill;
        });
        setAnswers(pf);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, profile]);

  const ok = questions
    ? questions.filter((q) => q.required).every((q) => answers[q.id])
    : false;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, display: "flex", padding: 4 }}>
            <Icon d={IDs.back} size={22} color={C.primary} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "system-ui,sans-serif", color: C.text }}>Your Context</h2>
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <div style={{ background: `${C.primary}10`, borderRadius: 12, padding: "12px 14px", marginBottom: 20, border: `1px solid ${C.primary}20` }}>
          <div style={{ fontSize: 12, color: C.tt, marginBottom: 4 }}>Searching for:</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.primaryDark }}>{query}</div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Dots />
            <p style={{ color: C.ts, fontSize: 14, marginTop: 12 }}>Tailoring questions...</p>
          </div>
        )}

        {error && (
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, textAlign: "center" }}>
            <p style={{ color: C.error, fontSize: 14 }}>{error}</p>
            <button onClick={onBack} style={{ background: C.primary, color: "white", border: "none", borderRadius: 10, padding: "10px 24px", cursor: "pointer", marginTop: 10, fontSize: 14, fontWeight: 600 }}>Go Back</button>
          </div>
        )}

        {questions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {questions.map((q) => (
              <div key={q.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
                  {q.text}
                  {!q.required && <span style={{ color: C.tt, fontWeight: 400, fontSize: 12 }}> (optional)</span>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {q.options.map((opt) => {
                    const sel = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          setAnswers((a) => {
                            const n = { ...a };
                            if (sel) delete n[q.id];
                            else n[q.id] = opt;
                            return n;
                          })
                        }
                        style={{
                          background: sel ? C.primary : C.surfaceAlt,
                          color: sel ? "white" : C.text,
                          border: `1.5px solid ${sel ? C.primary : C.border}`,
                          borderRadius: 10,
                          padding: "8px 14px",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: sel ? 600 : 500,
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => ok && onSubmit(answers, questions)}
              disabled={!ok}
              className={ok ? "gradient-button" : undefined}
              style={{
                background: ok ? undefined : C.tt,
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: 16,
                cursor: ok ? "pointer" : "not-allowed",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "system-ui,sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
                opacity: ok ? 1 : 0.6,
              }}
            >
              <Icon d={IDs.sparkle} size={18} color="white" />
              Get My Personalized Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
