"use client";

import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import confetti from "canvas-confetti";
import { CitHero } from "@/components/ui/CitHero";

interface LandingScreenProps {
  onSelectPlan: (plan: "free" | "basic" | "pro") => void;
  onSearch: (query: string) => void;
  onSignIn: () => void;
  initialView?: "home" | "plans" | "how-it-works";
}

function CitedMark({ size = 72 }: { size?: number }) {
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

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="7.5" cy="7.5" r="7.5" fill="rgba(0,212,170,0.15)" />
      <path d="M4 7.5L6.5 10L11 5" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { C } = useTheme();
  return (
    <button onClick={onClick} style={{
      alignSelf: "flex-start", background: "none", border: "none",
      color: C.ts, fontSize: 14, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6, padding: 0,
      fontFamily: "inherit",
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

const EXAMPLES = [
  "Does creatine affect sleep quality?",
  "Best evidence for cognitive longevity",
  "Is cold exposure beneficial for recovery?",
  "Omega-3 dosage for cardiovascular health",
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Ask your question",
    body: "Type any health question in plain language. CITED understands context and medical nuance — no need for technical terms.",
  },
  {
    num: "02",
    title: "AI searches the literature",
    body: "CITED scans PubMed and peer-reviewed medical databases in real time, pulling the most relevant studies for your question.",
  },
  {
    num: "03",
    title: "Personalize with context",
    body: "Answer 2–3 quick follow-up questions so your results reflect your age, goals, health conditions, and lifestyle.",
  },
  {
    num: "04",
    title: "Get your evidence-based answer",
    body: "Receive a synthesized answer grounded in real research — with inline citations, evidence quality ratings, and actionable steps.",
  },
];

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    period: "/mo",
    desc: "Get started today",
    features: ["3 AI searches / month", "5 follow-up searches / week", "Evidence summaries", "Personalized context"],
    cta: "Get Started",
    featured: false,
  },
  {
    id: "basic" as const,
    name: "Basic",
    price: 9.99,
    yearlyPrice: 7.99,
    period: "/mo",
    desc: "For regular health research",
    features: ["25 premium searches / month", "30 follow-up searches / week", "All Free features", "Priority processing"],
    cta: "Get Basic",
    featured: true,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 24.99,
    yearlyPrice: 19.99,
    period: "/mo",
    desc: "For power users",
    features: ["75 premium searches / month", "200 follow-up searches / week", "All Basic features", "Highest capabilities"],
    cta: "Get Pro",
    featured: false,
  },
];

// ─── How It Works view ────────────────────────────────────────────────────────
function HowItWorksView({ onBack }: { onBack: () => void }) {
  const { C } = useTheme();
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 36 }}>
        <BackButton onClick={onBack} />

        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            How It Works
          </span>
          <h2 style={{
            fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 900, color: C.text,
            margin: "10px 0 8px 0", letterSpacing: "-1px",
          }}>
            From question to evidence in seconds.
          </h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0 }}>
            CITED is not a search engine. It reads the research so you don't have to.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 20, padding: "22px 24px",
              display: "flex", gap: 20, alignItems: "flex-start",
            }}>
              <div style={{
                background: "linear-gradient(135deg, #00D4AA, #00B894)",
                borderRadius: 10, padding: "7px 10px",
                fontSize: 12, fontWeight: 900, color: "#0A1628",
                letterSpacing: "0.05em", flexShrink: 0, minWidth: 38, textAlign: "center",
              }}>
                {step.num}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 5 }}>{step.title}</div>
                <div style={{ fontSize: 14, color: C.ts, lineHeight: 1.65 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)",
          borderRadius: 16, padding: "18px 22px",
          fontSize: 14, color: C.ts, lineHeight: 1.7,
        }}>
          <span style={{ color: C.primary, fontWeight: 700 }}>Built on PubMed. </span>
          Every result CITED returns is traceable to a real peer-reviewed study. No opinion pieces, no blogs — only verified research with source links you can open directly.
        </div>
      </div>
    </div>
  );
}

// ─── Plans view with inline auth for paid plans ───────────────────────────────
function PlansView({ onSelectPlan, onBack }: { onSelectPlan: (p: "free" | "basic" | "pro") => void; onBack: () => void }) {
  const { C, isDark } = useTheme();
  const supabase = createClient();
  const [isMonthly, setIsMonthly] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [authFor, setAuthFor] = useState<"basic" | "pro" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function check() { setIsDesktop(window.innerWidth >= 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function handleToggle() {
    const switchingToAnnual = isMonthly;
    setIsMonthly(!isMonthly);
    if (switchingToAnnual && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      // CitedMark cross/plus shape
      const plusPath = "M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z";
      const crossShape = confetti.shapeFromPath({ path: plusPath });
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { x, y },
        colors: ["#00D4AA", "#00B894", "#00E5B5", "#CCFBF1"],
        shapes: [crossShape],
        scalar: 1.1,
        ticks: 220,
        gravity: 1.1,
        decay: 0.93,
        startVelocity: 28,
      });
    }
  }

  async function handlePlanAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!authFor) return;
    setAuthError("");
    setAuthLoading(true);
    localStorage.setItem("cited-pending-plan", authFor);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!signInErr) return;
    const { error: signUpErr } = await supabase.auth.signUp({ email, password });
    setAuthLoading(false);
    if (signUpErr) {
      setAuthError(signUpErr.message);
      localStorage.removeItem("cited-pending-plan");
      return;
    }
    setCheckEmail(true);
  }

  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : C.surfaceAlt;
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : C.border;

  if (checkEmail) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ maxWidth: 440, textAlign: "center", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CitedMark size={56} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: 0 }}>Check your email</h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0, lineHeight: 1.65 }}>
            We sent a confirmation link to <strong style={{ color: C.text }}>{email}</strong>.
            Click it to verify your account and you will be taken directly to your {authFor} plan checkout.
          </p>
          <button onClick={() => { setCheckEmail(false); setAuthFor(null); }} style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "10px 20px", color: C.ts,
            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>
            Back to plans
          </button>
        </div>
      </div>
    );
  }

  if (authFor) {
    const plan = PLANS.find(p => p.id === authFor)!;
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "48px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 28 }}>
          <BackButton onClick={() => { setAuthFor(null); setAuthError(""); }} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {plan.name} — ${isMonthly ? plan.price : plan.yearlyPrice}/mo
            </span>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: "8px 0 6px 0", letterSpacing: "-0.5px" }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: C.ts, margin: 0 }}>
              Enter your details to continue to payment.
            </p>
          </div>
          <form onSubmit={handlePlanAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address" required
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
            />
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password" required minLength={6}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
            />
            {authError && <p style={{ fontSize: 13, color: "#FF6B6B", margin: 0 }}>{authError}</p>}
            <button
              type="submit"
              disabled={authLoading || !email || !password}
              className="gradient-button"
              style={{
                border: "none", borderRadius: 12, padding: "14px", color: "white",
                fontSize: 15, fontWeight: 800, cursor: authLoading ? "wait" : "pointer",
                fontFamily: "inherit", marginTop: 4, width: "100%",
                opacity: authLoading || !email || !password ? 0.6 : 1,
              }}
            >
              {authLoading ? "Continuing..." : "Continue to payment"}
            </button>
          </form>
          <p style={{ fontSize: 12, color: C.tt, textAlign: "center", margin: 0 }}>
            Secure payments via Stripe · Cancel anytime
          </p>
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
      <div style={{ width: "100%", maxWidth: 920, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
          <BackButton onClick={onBack} />
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Pricing
          </span>
          <h2 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 900, color: C.text, margin: "10px 0 10px 0", letterSpacing: "-1px" }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0 }}>
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: isMonthly ? C.text : C.tt, transition: "color 0.2s" }}>
            Monthly
          </span>
          <button
            ref={toggleRef}
            onClick={handleToggle}
            aria-label="Toggle billing period"
            style={{
              position: "relative",
              width: 44, height: 24,
              background: !isMonthly ? "#00D4AA" : (isDark ? "rgba(255,255,255,0.15)" : C.border),
              borderRadius: 12, border: "none", cursor: "pointer",
              transition: "background 0.25s", flexShrink: 0, padding: 0,
            }}
          >
            <span style={{
              position: "absolute",
              top: 2, left: !isMonthly ? 22 : 2,
              width: 20, height: 20,
              background: "white",
              borderRadius: "50%",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              display: "block",
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: !isMonthly ? C.text : C.tt, transition: "color 0.2s" }}>
            Annual{" "}
            <span style={{ color: "#00D4AA", fontSize: 12 }}>(Save 20%)</span>
          </span>
        </div>

        {/* Plan cards */}
        <div style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          justifyContent: "center", width: "100%",
          alignItems: "center",
        }}>
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ y: 50, opacity: 0 }}
              whileInView={isDesktop ? {
                y: plan.featured ? -20 : 0,
                x: index === 2 ? -30 : index === 0 ? 30 : 0,
                scale: index === 0 || index === 2 ? 0.94 : 1.0,
                opacity: 1,
              } : { y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, type: "spring", stiffness: 100, damping: 30, delay: index * 0.08 + 0.2 }}
              style={{
                background: plan.featured ? "rgba(0,212,170,0.06)" : C.surface,
                border: plan.featured ? "2px solid #00D4AA" : `1px solid ${C.border}`,
                borderRadius: 24, padding: "32px 28px",
                flex: "1 1 240px", maxWidth: 290,
                position: "relative",
                boxShadow: plan.featured ? "0 0 48px rgba(0,212,170,0.18)" : "none",
                display: "flex", flexDirection: "column",
                zIndex: plan.featured ? 10 : 0,
                ...((!plan.featured && isDesktop) ? { marginTop: 20 } : {}),
              }}
            >
              {plan.featured && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: "linear-gradient(90deg, #00D4AA, #00B894)",
                  borderRadius: 100, padding: "5px 18px",
                  fontSize: 10, fontWeight: 800, color: "#0A1628",
                  letterSpacing: "0.08em", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {/* Mini CitedMark cross */}
                  <svg width="10" height="10" viewBox="0 0 100 100" fill="none">
                    <rect x="31.5" y="0" width="37" height="100" rx="8" fill="#0A1628" />
                    <rect x="0" y="31.5" width="100" height="37" rx="8" fill="#0A1628" />
                  </svg>
                  MOST POPULAR
                </div>
              )}

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: plan.featured ? C.primary : C.tt, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {plan.name}
                </p>

                {/* Animated price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: C.text, letterSpacing: "-2px", lineHeight: 1 }}>
                    $<NumberFlow
                      value={isMonthly ? plan.price : plan.yearlyPrice}
                      format={{ minimumFractionDigits: plan.price === 0 ? 0 : 2, maximumFractionDigits: 2 }}
                      transformTiming={{ duration: 500, easing: "ease-out" }}
                      willChange
                    />
                  </span>
                  <span style={{ fontSize: 14, color: C.tt, fontWeight: 500 }}>/mo</span>
                </div>
                <p style={{ fontSize: 12, color: C.tt, margin: "0 0 6px 0" }}>
                  {isMonthly ? "billed monthly" : "billed annually"}
                </p>
                <p style={{ fontSize: 13, color: C.ts, margin: "0 0 20px 0" }}>{plan.desc}</p>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, flex: 1 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <CheckIcon />
                      <span style={{ fontSize: 13, color: C.ts, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

                {/* CTA */}
                <button
                  onClick={() => plan.id === "free" ? onSelectPlan("free") : setAuthFor(plan.id)}
                  className="gradient-button"
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 12, padding: "13px",
                    color: "white",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: C.tt, textAlign: "center" }}>
          Secure payments via Stripe · Cancel anytime · Not medical advice
        </p>
      </div>
    </div>
  );
}

// ─── Main landing ─────────────────────────────────────────────────────────────
export function LandingScreen({ onSelectPlan, onSearch, onSignIn, initialView = "home" }: LandingScreenProps) {
  const { C, isDark, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"home" | "plans" | "how-it-works">(initialView);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  }

  if (view === "how-it-works") {
    return (
      <div className="cited-landing">
        <HowItWorksView onBack={() => setView("home")} />
      </div>
    );
  }

  if (view === "plans") {
    return (
      <div className="cited-landing">
        <PlansView onSelectPlan={onSelectPlan} onBack={() => setView("home")} />
      </div>
    );
  }

  const textPrimary = isDark ? "white" : C.text;
  const textSub     = isDark ? "rgba(255,255,255,0.5)"  : C.ts;
  const textMuted   = isDark ? "rgba(255,255,255,0.28)" : C.tt;
  const inputBg     = isDark ? "rgba(255,255,255,0.05)" : C.surface;
  const inputBorder = isDark ? "rgba(255,255,255,0.1)"  : C.border;
  const exBg        = isDark ? "rgba(0,212,170,0.07)"   : `${C.primary}12`;
  const exBorder    = isDark ? "rgba(0,212,170,0.18)"   : `${C.primary}30`;
  const exText      = isDark ? "rgba(255,255,255,0.6)"  : C.ts;
  const howBorder   = isDark ? "rgba(255,255,255,0.12)" : C.border;
  const howText     = isDark ? "rgba(255,255,255,0.55)" : C.ts;

  return (
    <div
      className="cited-landing"
      style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top-right actions */}
      <div style={{ position: "absolute", top: 20, right: 24, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <button
          onClick={onSignIn}
          className="gradient-button"
          style={{
            border: "none",
            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            color: "white", fontSize: 12, fontWeight: 700,
            fontFamily: "inherit",
          }}
        >
          Sign In
        </button>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          style={{
            background: inputBg, border: `1px solid ${inputBorder}`,
            borderRadius: 10, padding: "8px 10px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            color: textSub, fontSize: 12, fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(0,212,170,${isDark ? "0.07" : "0.04"}) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 600,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 36, position: "relative", zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
            width: 90, height: 90, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,170,0.22) 0%, transparent 70%)",
            filter: "blur(18px)", pointerEvents: "none",
          }} />
          <span style={{ fontSize: "clamp(38px, 8vw, 54px)", fontWeight: 900, color: "white", letterSpacing: "-2px", lineHeight: 1, fontFamily: "system-ui,sans-serif" }}>CI</span>
          <div style={{ animation: "cited-spin-burst 3.6s cubic-bezier(0.22, 0, 0.1, 1) infinite", display: "flex", alignItems: "center", margin: "0 1px" }}>
            <CitedMark size={40} />
          </div>
          <span style={{ fontSize: "clamp(38px, 8vw, 54px)", fontWeight: 900, color: "white", letterSpacing: "-2px", lineHeight: 1, fontFamily: "system-ui,sans-serif" }}>ED</span>
        </div>

        {/* Cit Hero — audio intro */}
        <CitHero />

        {/* Headline */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(30px, 6vw, 50px)", fontWeight: 900, color: textPrimary,
            margin: "0 0 14px 0", letterSpacing: "-1.5px", lineHeight: 1.1,
          }}>
            Ask any health question.
          </h1>
          <p style={{ fontSize: 17, color: textSub, margin: 0, lineHeight: 1.65, maxWidth: 420 }}>
            CITED searches peer-reviewed research and gives you evidence-based answers personalized to your biology.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div style={{
            display: "flex", gap: 8,
            background: inputBg, border: `1px solid ${inputBorder}`,
            borderRadius: 18, padding: "6px 6px 6px 22px",
          }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Does magnesium improve sleep quality?"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: textPrimary, fontSize: 16, padding: "11px 0", minWidth: 0,
              }}
              autoFocus
            />
            <button type="submit" disabled={!query.trim()}
              className={query.trim() ? "gradient-button" : undefined}
              style={{
                background: query.trim() ? undefined : inputBorder,
                border: "none", borderRadius: 13, padding: "12px 26px",
                color: query.trim() ? "white" : textSub,
                fontSize: 15, fontWeight: 700,
                cursor: query.trim() ? "pointer" : "default",
                transition: "all 0.2s", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit",
              }}>
              Search
            </button>
          </div>
        </form>

        {/* Examples */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setQuery(ex)} style={{
              background: exBg, border: `1px solid ${exBorder}`,
              borderRadius: 100, padding: "7px 16px",
              color: exText, fontSize: 13, cursor: "pointer",
              transition: "all 0.15s", fontFamily: "inherit",
            }}>
              {ex}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: textMuted, margin: 0, letterSpacing: "0.03em", textAlign: "center" }}>
          Free to try · No account required · Backed by PubMed
        </p>

        {/* Secondary CTAs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: -8 }}>
          <button onClick={() => setView("plans")} className="gradient-button" style={{
            border: "none",
            borderRadius: 12, padding: "11px 24px",
            color: "white", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            View Plans
          </button>
          <button onClick={() => setView("how-it-works")} style={{
            background: "transparent", border: `1px solid ${howBorder}`,
            borderRadius: 12, padding: "11px 24px",
            color: howText, fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}>
            How does it work?
          </button>
        </div>

        <p style={{ fontSize: 12, color: textMuted, margin: "-16px 0 0 0" }}>
          cited.health
        </p>
      </div>
    </div>
  );
}
