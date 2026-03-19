"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

interface AuthScreenProps {
  onAuthed: () => void;
}

function CitedMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="31.5" y="0" width="37" height="100" rx="10" fill="url(#cg)" />
      <rect x="0" y="31.5" width="100" height="37" rx="10" fill="url(#cg)" />
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5B5" />
          <stop offset="100%" stopColor="#00B894" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function AuthScreen({ onAuthed }: AuthScreenProps) {
  const { C, isDark, toggle } = useTheme();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const supabase = createClient();

  // Compute surface/input colors based on theme
  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : C.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : C.border;
  const inputText   = isDark ? "white" : C.text;
  const tabActiveBg = isDark ? "rgba(255,255,255,0.1)" : C.surface;
  const tabBg       = isDark ? "rgba(255,255,255,0.05)" : C.surfaceAlt;
  const tabBorder   = isDark ? "rgba(255,255,255,0.08)" : C.border;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : "https://cited.health"}/auth/callback?type=recovery`,
      });
      if (error) setError(error.message);
      else setCheckEmail(true);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuthed();
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: inputText,
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  if (checkEmail) {
    const isForgot = mode === "forgot";
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <SparklesCore background="transparent" minSize={0.3} maxSize={0.9} particleDensity={40} particleColor={isDark ? "#00D4AA" : "#006B57"} speed={0.4} className="w-full h-full" />
        </div>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CitedMark size={52} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>Check your email</h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0, lineHeight: 1.65 }}>
            {isForgot
              ? <>We sent a password reset link to <strong style={{ color: C.text }}>{email}</strong>. Click it to choose a new password.</>
              : <>We sent a confirmation link to <strong style={{ color: C.text }}>{email}</strong>. Click it to verify your account, then sign in.</>
            }
          </p>
          <button
            onClick={() => { setCheckEmail(false); setMode("login"); setError(""); }}
            style={{
              background: "none", border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "10px 20px", color: C.ts,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <SparklesCore background="transparent" minSize={0.3} maxSize={0.9} particleDensity={40} particleColor={isDark ? "#00D4AA" : "#006B57"} speed={0.4} className="w-full h-full" />
      </div>
      {/* Theme toggle */}
      <button onClick={toggle} aria-label="Toggle theme" style={{ position: "absolute", top: 20, right: 24, zIndex: 2, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.ts, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
        {isDark ? "Light" : "Dark"}
      </button>

      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 28, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CitedMark size={36} />
          <span style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: 1.2 }}>
            CI<span style={{ color: "#00D4AA" }}>✚</span>ED
          </span>
        </div>

        {/* Heading */}
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
          </h2>
          <p style={{ fontSize: 14, color: C.ts, margin: 0 }}>
            {mode === "login" ? "Sign in to continue to CITED."
              : mode === "signup" ? "Start your evidence-based health journey."
              : "Enter your email and we will send you a reset link."}
          </p>
        </div>

        {/* Mode toggle — hidden in forgot mode */}
        {mode !== "forgot" && (
          <div style={{
            display: "flex", background: tabBg,
            borderRadius: 12, padding: 4, border: `1px solid ${tabBorder}`,
          }}>
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  background: mode === m ? tabActiveBg : "transparent",
                  color: mode === m ? C.text : C.tt,
                  border: "none", borderRadius: 10,
                  padding: "9px 12px", cursor: "pointer",
                  fontSize: 13, fontWeight: mode === m ? 700 : 500,
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        {/* Back link in forgot mode */}
        {mode === "forgot" && (
          <button
            onClick={() => { setMode("login"); setError(""); }}
            style={{
              alignSelf: "flex-start", background: "none", border: "none",
              color: C.ts, fontSize: 13, cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit",
            }}
          >
            <BackArrow /> Back to sign in
          </button>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email address"
            style={inputStyle}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={mode === "signup" ? "Password (min. 6 characters)" : "Password"}
              style={inputStyle}
            />
          )}

          {/* Forgot password link */}
          {mode === "login" && (
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); setPassword(""); }}
              style={{
                background: "none", border: "none", padding: 0,
                color: C.ts, fontSize: 12, cursor: "pointer",
                textAlign: "right", fontFamily: "inherit",
              }}
            >
              Forgot password?
            </button>
          )}

          {error && <p style={{ fontSize: 13, color: "#FF6B6B", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !email || (mode !== "forgot" && !password)}
            className="gradient-button"
            style={{
              border: "none", borderRadius: 12, padding: "14px",
              color: "white", fontSize: 15, fontWeight: 800,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "inherit", marginTop: 4, width: "100%",
              opacity: loading || !email || (mode !== "forgot" && !password) ? 0.6 : 1,
            }}
          >
            {loading ? "Please wait..."
              : mode === "login" ? "Sign In"
              : mode === "signup" ? "Create Account"
              : "Send reset link"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: C.tt, textAlign: "center", margin: 0 }}>
          Your health data stays private · Nothing uncited.
        </p>
      </div>
    </div>
  );
}
