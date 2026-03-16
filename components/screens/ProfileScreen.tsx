"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import type { UserProfile } from "@/types";

const SINGLE_FIELDS = [
  { id: "ageRange", label: "Age Range", options: ["Teen (13–17)", "Young Adult (18–25)", "Adult (26–40)", "Adult (41–60)", "60+"] },
  { id: "sex", label: "Biological Sex", options: ["Male", "Female", "Prefer not to say"] },
  { id: "activityLevel", label: "Activity Level", options: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Athlete"] },
  { id: "goals", label: "Primary Goal", options: ["General Health", "Athletic Performance", "Weight Management", "Recovery/Rehab", "Mental Wellness", "Longevity"] },
  { id: "dietPattern", label: "Diet Pattern", options: ["No Restrictions", "Vegetarian", "Vegan", "Keto/Low-Carb", "Mediterranean", "Other"] },
  { id: "sleepQuality", label: "Sleep Quality", options: ["Poor", "Fair", "Good", "Excellent"] },
];

const MULTI_FIELDS = [
  {
    id: "healthConditions",
    label: "Health Conditions / Concerns",
    note: "optional — select all that apply",
    options: ["None", "Heart Health", "Blood Sugar/Diabetes", "Joint/Bone Issues", "Mental Health", "Digestive Health", "Hormonal Health", "Autoimmune", "Other"],
  },
  {
    id: "supplements",
    label: "Current Supplements",
    note: "optional — select all that apply",
    options: ["None", "Protein", "Creatine", "Vitamins/Minerals", "Omega-3", "Pre-workout", "Magnesium", "Adaptogens", "Other"],
  },
];

function toggleMulti(current: string | undefined, value: string): string {
  if (value === "None") return "None";
  const vals = (current || "").split(",").filter(v => v && v !== "None");
  if (vals.includes(value)) return vals.filter(v => v !== value).join(",");
  return [...vals, value].join(",");
}

interface ProfileScreenProps {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onLogout: () => void;
  userEmail?: string;
}

export function ProfileScreen({ profile, onSave, onLogout, userEmail }: ProfileScreenProps) {
  const { C, isDark } = useTheme();
  const supabase = createClient();
  const [draft, setDraft] = useState<UserProfile>(profile ?? {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  // Change email state
  const [emailView, setEmailView] = useState<"idle" | "form" | "sent">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError("");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailView("sent");
    }
  }

  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : C.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : C.border;

  async function save() {
    setSaving(true);
    setSaveError("");
    setSaveOk(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSaveError(data.error ?? "Could not save profile. Make sure you are signed in.");
      } else {
        onSave(draft);
        setEditing(false);
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const current = editing ? draft : (profile ?? {});

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 80 }}>
      <div style={{ background: C.surface, padding: "24px 18px 18px", borderBottom: `1px solid ${C.borderLight}` }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, fontFamily: "system-ui,sans-serif", color: C.text }}>Profile</h2>
        {userEmail && <p style={{ margin: 0, fontSize: 13, color: C.tt }}>{userEmail}</p>}
        <p style={{ margin: "8px 0 0", fontSize: 12, color: C.tt, lineHeight: 1.5 }}>
          Helps CITED personalize every result — like a coach who already knows you.
        </p>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

        {SINGLE_FIELDS.map((f) => (
          <div key={f.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{f.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {f.options.map((opt) => {
                const sel = current[f.id as keyof UserProfile] === opt;
                return (
                  <button key={opt} onClick={() => { if (!editing) setEditing(true); setDraft(d => ({ ...d, [f.id]: sel ? undefined : opt })); }}
                    style={{ background: sel ? C.primary : C.surfaceAlt, color: sel ? "white" : C.text, border: `1.5px solid ${sel ? C.primary : C.border}`, borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 500 }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {MULTI_FIELDS.map((f) => (
          <div key={f.id} style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: C.tt, marginBottom: 10 }}>{f.note}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {f.options.map((opt) => {
                const vals = (current[f.id as keyof UserProfile] || "").split(",").filter(Boolean);
                const sel = vals.includes(opt);
                return (
                  <button key={opt} onClick={() => { if (!editing) setEditing(true); setDraft(d => ({ ...d, [f.id]: toggleMulti(d[f.id as keyof UserProfile] as string | undefined, opt) })); }}
                    style={{ background: sel ? C.primary : C.surfaceAlt, color: sel ? "white" : C.text, border: `1.5px solid ${sel ? C.primary : C.border}`, borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 500 }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {editing && (
          <button onClick={save} disabled={saving}
            className="gradient-button"
            style={{ border: "none", borderRadius: 14, padding: 16, cursor: saving ? "wait" : "pointer", fontSize: 16, fontWeight: 700, fontFamily: "system-ui,sans-serif", color: "white", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        )}

        {saveError && (
          <div style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#FF6B6B" }}>
            {saveError}
          </div>
        )}

        {saveOk && (
          <div style={{ background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.4)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: C.primary, fontWeight: 600 }}>
            Profile saved successfully.
          </div>
        )}

        {/* Account section */}
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Account</div>

          {emailView === "idle" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: C.tt, marginBottom: 2 }}>Email address</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{userEmail}</div>
              </div>
              <button
                onClick={() => { setEmailView("form"); setEmailError(""); setNewEmail(""); }}
                style={{
                  background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  borderRadius: 9, padding: "7px 14px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: C.ts, fontFamily: "inherit", whiteSpace: "nowrap",
                }}
              >
                Change
              </button>
            </div>
          )}

          {emailView === "form" && (
            <form onSubmit={handleChangeEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, color: C.ts }}>Enter your new email address. We will send a confirmation link.</div>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                placeholder="New email address"
                style={{
                  background: inputBg, border: `1px solid ${inputBorder}`,
                  borderRadius: 10, padding: "11px 14px", color: C.text,
                  fontSize: 14, outline: "none", fontFamily: "inherit",
                  width: "100%", boxSizing: "border-box",
                }}
              />
              {emailError && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{emailError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEmailView("idle")}
                  style={{
                    flex: 1, background: "none", border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: "10px", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, color: C.ts, fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emailLoading || !newEmail}
                  className="gradient-button"
                  style={{
                    flex: 2, border: "none", borderRadius: 10, padding: "10px",
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: emailLoading ? "wait" : "pointer", fontFamily: "inherit",
                    opacity: emailLoading || !newEmail ? 0.6 : 1,
                  }}
                >
                  {emailLoading ? "Sending..." : "Send confirmation"}
                </button>
              </div>
            </form>
          )}

          {emailView === "sent" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>Confirmation sent</div>
              <div style={{ fontSize: 13, color: C.ts, lineHeight: 1.6 }}>
                Check <strong style={{ color: C.text }}>{newEmail}</strong> and click the link to confirm your new email address.
              </div>
              <button
                onClick={() => setEmailView("idle")}
                style={{
                  background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 9, padding: "8px 14px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: C.ts, fontFamily: "inherit", alignSelf: "flex-start",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        <button onClick={onLogout}
          style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: 12, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.ts, marginTop: 8 }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
