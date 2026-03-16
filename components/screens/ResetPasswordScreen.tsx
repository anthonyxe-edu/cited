"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";

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

interface ResetPasswordScreenProps {
  onDone: () => void;
}

export function ResetPasswordScreen({ onDone }: ResetPasswordScreenProps) {
  const { C, isDark } = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : C.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : C.border;

  const inputStyle: React.CSSProperties = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 12,
    padding: "13px 16px",
    color: C.text,
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CitedMark size={52} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>Password updated</h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0, lineHeight: 1.65 }}>
            Your password has been changed. You are now signed in.
          </p>
          <button
            onClick={onDone}
            className="gradient-button"
            style={{ border: "none", borderRadius: 12, padding: "14px", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", width: "100%" }}
          >
            Go to app
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
    }}>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CitedMark size={36} />
          <span style={{ fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: 1.2 }}>
            CI<span style={{ color: "#00D4AA" }}>+</span>ED
          </span>
        </div>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4AA", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Password reset
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "8px 0 6px", letterSpacing: "-0.5px" }}>
            Choose a new password.
          </h2>
          <p style={{ fontSize: 14, color: C.ts, margin: 0 }}>
            Your new password must be at least 6 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="New password"
            style={inputStyle}
            autoFocus
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            placeholder="Confirm new password"
            style={inputStyle}
          />

          {error && <p style={{ fontSize: 13, color: "#FF6B6B", margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !confirm}
            className="gradient-button"
            style={{ border: "none", borderRadius: 12, padding: "14px", color: "white", fontSize: 15, fontWeight: 800, cursor: loading ? "wait" : "pointer", marginTop: 4, width: "100%", opacity: loading || !password || !confirm ? 0.6 : 1 }}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: C.tt, textAlign: "center", margin: 0 }}>
          Your health data stays private · Nothing uncited.
        </p>
      </div>
    </div>
  );
}
