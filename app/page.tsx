"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { NavBar } from "@/components/ui/NavBar";
import { AuthScreen } from "@/components/screens/AuthScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ContextScreen } from "@/components/screens/ContextScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { JournalScreen } from "@/components/screens/JournalScreen";
import { ForYouScreen } from "@/components/screens/ForYouScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ResetPasswordScreen } from "@/components/screens/ResetPasswordScreen";
import { ThemeProvider, useTheme } from "@/lib/theme";
import type { Screen, SavedEntry, ContextQuestion, UserProfile, EvidenceResult } from "@/types";

import { CitedText } from "@/components/ui/CitedText";
import { ShareSheet } from "@/components/ui/ShareSheet";
import { EvBadge, Badge, VerifiedBadge, DbBadge } from "@/components/ui/Badges";
import { SparklesCore } from "@/components/ui/sparkles";
import { Icon, IDs } from "@/components/ui/Icons";

/* ── Page transition variants ──────────────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit:    { opacity: 0, y: -12, filter: "blur(3px)" },
};
const pageTransition = {
  duration: 0.35,
  ease: [0.25, 0.8, 0.25, 1] as [number, number, number, number],
};

/* Wrapper that applies the transition to any screen */
function PageWrap({ children, screenKey }: { children: React.ReactNode; screenKey: string }) {
  return (
    <motion.div
      key={screenKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      style={{ width: "100%", minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
}

/* Landing / Auth use a softer crossfade (no vertical slide) */
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};
const fadeTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

function SavedView({ item, onBack }: { item: SavedEntry; onBack: () => void }) {
  const { C } = useTheme();
  const [exp, setExp] = useState<Record<string, boolean>>({});
  const [showShare, setShowShare] = useState(false);
  const r = item.result as EvidenceResult;

  function toggle(k: string) { setExp((e) => ({ ...e, [k]: !e[k] })); }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 100 }}>
      {showShare && <ShareSheet query={item.query} evidenceSummary={r.evidence_summary} personalSummary={r.personalized_interpretation} sources={r.sources ?? []} onClose={() => setShowShare(false)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon d={IDs.back} size={22} color={C.primary} /></button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Saved Result</h2>
        </div>
        <button onClick={() => setShowShare(true)} style={{ background: `${C.primary}18`, border: `1.5px solid ${C.primary}`, borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: C.primary, fontSize: 13, fontWeight: 600 }}>
          <Icon d={IDs.share} size={14} color={C.primary} /> Share
        </button>
      </div>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: `linear-gradient(135deg,${C.primaryDeep},${C.primaryDark})`, borderRadius: 16, padding: "18px 16px", color: "white" }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{item.query}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <EvBadge level={r.evidence_quality?.level ?? "Moderate"} />
            <Badge color="white" bg="rgba(255,255,255,0.15)">{(r.sources ?? []).filter(s => s.verified).length} verified</Badge>
          </div>
        </div>
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon d={IDs.bar} size={16} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Evidence</span>
          </div>
          <div style={{ fontSize: 14, color: C.ts, lineHeight: 1.75 }}>
            <CitedText text={r.evidence_summary} sources={r.sources ?? []} />
          </div>
        </div>
        <div style={{ background: C.surface, borderRadius: 16, border: `1.5px solid ${C.primary}40`, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon d={IDs.target} size={16} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700, color: C.primaryDark }}>For You</span>
          </div>
          <div style={{ fontSize: 14, color: C.text, lineHeight: 1.75 }}>
            <CitedText text={r.personalized_interpretation} sources={r.sources ?? []} />
          </div>
        </div>
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
          <button onClick={() => toggle("src")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={IDs.book} size={16} color={C.primary} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Sources ({r.sources?.length ?? 0})</span>
            </div>
            <Icon d={IDs.chevDown} size={18} color={C.tt} style={{ transform: exp.src ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          {exp.src && (
            <div style={{ marginTop: 12 }}>
              {r.sources?.map((s, i) => (
                <div key={i} style={{ padding: "10px 12px", background: C.surfaceAlt, borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{s.title}</div>
                    {s.verified && <VerifiedBadge />}
                  </div>
                  <div style={{ fontSize: 11, color: C.tt, marginBottom: 3 }}>{s.authors} · {s.year}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.source_db && <DbBadge db={s.source_db} />}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>Open ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GlobalBackground() {
  const { isDark } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <SparklesCore
        id="global-bg-sparkles"
        background="transparent"
        minSize={0.5}
        maxSize={1.1}
        particleDensity={18}
        particleColor={isDark ? "#00D4AA" : "#006B57"}
        speed={0.4}
        className="w-full h-full"
      />
    </div>
  );
}

/* ── Guest paywall overlay ──────────────────────────────────────────────── */
function GuestPaywall({ onCreateAccount, onSelectPlan }: { onCreateAccount: () => void; onSelectPlan: () => void }) {
  const { C, isDark } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: isDark ? "rgba(6,14,28,0.92)" : "rgba(240,253,250,0.95)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.8, 0.25, 1] }}
        style={{
          maxWidth: 420, width: "100%", textAlign: "center",
          display: "flex", flexDirection: "column", gap: 24, alignItems: "center",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: "linear-gradient(135deg, #00E5B5, #00B894)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(0,212,170,0.3)",
        }}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
            <rect x="31.5" y="0" width="37" height="100" rx="10" fill="white" />
            <rect x="0" y="31.5" width="100" height="37" rx="10" fill="white" />
          </svg>
        </div>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
            Your free search is complete
          </h2>
          <p style={{ fontSize: 15, color: C.ts, margin: 0, lineHeight: 1.6 }}>
            Create a free account to keep searching, save results, and unlock personalized insights from Cit.
          </p>
        </div>

        {/* Tier hints */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", textAlign: "left" }}>
          {[
            { tier: "Free", desc: "1 search per day", color: C.ts },
            { tier: "Basic", desc: "More searches + saved results", color: "#00D4AA" },
            { tier: "Pro", desc: "Unlimited + Cit voice + priority", color: "#FFD700" },
          ].map(({ tier, desc, color }) => (
            <div key={tier} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderRadius: 12,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : C.border}`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, minWidth: 48 }}>{tier}</span>
              <span style={{ fontSize: 13, color: C.ts }}>{desc}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <button
            onClick={onCreateAccount}
            className="gradient-button"
            style={{
              border: "none", borderRadius: 14, padding: "15px",
              color: "white", fontSize: 16, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit", width: "100%",
            }}
          >
            Create Free Account
          </button>
          <button
            onClick={onSelectPlan}
            style={{
              background: "none",
              border: `1.5px solid ${isDark ? "rgba(0,212,170,0.3)" : C.border}`,
              borderRadius: 14, padding: "13px",
              color: C.ts, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", width: "100%",
            }}
          >
            View Plans & Pricing
          </button>
        </div>

        <p style={{ fontSize: 11, color: C.tt, margin: 0 }}>
          Your health data stays private · Nothing uncited.
        </p>
      </motion.div>
    </motion.div>
  );
}

function AppInner() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [landingInitialView, setLandingInitialView] = useState<"home" | "plans" | "how-it-works">("home");
  const [guestMode, setGuestMode] = useState(false);
  const [guestSearchDone, setGuestSearchDone] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [prefillQuery, setPrefillQuery] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<ContextQuestion[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedItems, setSavedItems] = useState<SavedEntry[]>([]);
  const [viewItem, setViewItem] = useState<SavedEntry | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const supabase = createClient();

  // Auth listener
  useEffect(() => {
    // Detect password reset redirect (?reset=1 set by /auth/callback)
    // Must run here (not useState initializer) so it works after SSR hydration
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      window.history.replaceState({}, "", "/");
      setResetMode(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setResetMode(true);
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // After auth: handle pending Stripe plan or initial query from landing
  useEffect(() => {
    if (!user) return;

    const plan = localStorage.getItem("cited-pending-plan");
    if (plan && (plan === "basic" || plan === "pro")) {
      localStorage.removeItem("cited-pending-plan");
      fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.url) window.location.href = data.url;
        });
      return;
    }

    const initialQuery = localStorage.getItem("cited-initial-query");
    if (initialQuery) {
      localStorage.removeItem("cited-initial-query");
      search(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load profile + saved items when authed
  useEffect(() => {
    if (!user) return;
    fetch("/api/profile").then(r => r.json()).then(data => {
      if (!data.error) setProfile(data);
    });
    fetch("/api/saved").then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setSavedItems(data.map(row => ({
          id: row.id,
          query: row.query,
          answers: row.answers,
          result: row.result,
          savedAt: row.saved_at,
        })));
      }
    });
    // Load recent searches from localStorage
    try {
      const r = localStorage.getItem("cited-recent");
      if (r) setRecentSearches(JSON.parse(r));
    } catch {}
  }, [user]);

  function handleSelectPlan(plan: "free" | "basic" | "pro") {
    if (plan !== "free") {
      localStorage.setItem("cited-pending-plan", plan);
    }
    setLandingInitialView("home");
    setShowLanding(false);
  }

  function handleGuestSelectPlan() {
    setGuestMode(false);
    setLandingInitialView("plans");
    setShowLanding(true);
  }

  function handleLandingSearch(q: string) {
    // Bypass auth — run the search immediately as a guest
    setGuestMode(true);
    search(q);
  }

  function suggest(q: string) {
    setPrefillQuery(q);
    setScreen("home");
  }

  function search(q: string) {
    // If guest already used their free search, show paywall
    if (guestMode && !user && guestSearchDone) {
      setShowPaywall(true);
      return;
    }
    if (guestMode && !user) setGuestSearchDone(true);
    setQuery(q);
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    try { localStorage.setItem("cited-recent", JSON.stringify(updated)); } catch {}
    setScreen("context");
  }

  const save = useCallback(async (item: { query: string; answers: Record<string, string>; result: EvidenceResult; savedAt: string }) => {
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const saved = await res.json();
      if (!saved.error) {
        setSavedItems(prev => [{ ...item, id: saved.id }, ...prev]);
      }
    } catch {}
  }, []);

  async function deleteItem(idx: number) {
    const item = savedItems[idx];
    if (item.id) {
      await fetch("/api/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
    }
    setSavedItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSavedItems([]);
    setScreen("home");
    setGuestMode(false);
    setShowLanding(true);
    setLandingInitialView("home");
  }

  function saveProfile(p: UserProfile) {
    setProfile(p);
  }

  function nav(s: Screen) {
    // Guest users can only access the search flow
    if (guestMode && !user && !["home", "context", "results"].includes(s)) {
      handleGuestSignUp();
      return;
    }
    setViewItem(null);
    setScreen(s);
  }

  // Show reset form as soon as we know — don't wait for full auth ready
  if (resetMode) {
    return <ResetPasswordScreen onDone={() => setResetMode(false)} />;
  }

  if (!authReady) {
    return (
      <>
        <GlobalBackground />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#00D4AA", fontFamily: "system-ui,sans-serif" }}>✚</span>
        </div>
      </>
    );
  }

  if (!user && !guestMode) {
    return (
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeTransition}
          >
            <LandingScreen onSelectPlan={handleSelectPlan} onSearch={handleLandingSearch} initialView={landingInitialView} onSignIn={() => setShowLanding(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeTransition}
          >
            <AuthScreen onAuthed={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const activeNav: Screen =
    ["home", "context", "results"].includes(screen) ? "home" :
    screen === "viewSaved" ? "journal" :
    screen;

  function handleGuestSignUp() {
    setGuestMode(false);
    setShowLanding(false); // goes to AuthScreen
  }

  return (
    <>
      <GlobalBackground />
      {/* Guest mode banner */}
      {guestMode && !user && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: "#00D4AA",
          padding: "10px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, color: "#0A1628", fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          gap: 12,
        }}>
          <span>Free preview. Create an account to save results and continue searching.</span>
          <button
            onClick={handleGuestSignUp}
            style={{
              background: "#0A1628", border: "none", borderRadius: 8,
              padding: "6px 14px", color: "#00D4AA", fontSize: 13,
              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            Create Account
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <PageWrap screenKey={screen} key={screen}>
          {screen === "home" && (
            <HomeScreen
              onSearch={(q) => {
                // Guest returning to home after their free search — show paywall on any new search attempt
                if (guestMode && !user && guestSearchDone) {
                  setShowPaywall(true);
                  return;
                }
                search(q);
              }}
              recentSearches={recentSearches}
              prefillQuery={prefillQuery}
              onClearRecent={() => {
                setRecentSearches([]);
                try { localStorage.removeItem("cited-recent"); } catch {}
              }}
            />
          )}

          {screen === "context" && (
            <ContextScreen
              query={query}
              profile={profile}
              onSubmit={(ans, qs) => { setAnswers(ans); setQuestions(qs); setScreen("results"); }}
              onBack={() => setScreen("home")}
            />
          )}

          {screen === "results" && (
            <ResultsScreen
              query={query}
              answers={answers}
              questions={questions}
              profile={profile}
              onBack={() => setScreen("context")}
              onHome={() => setScreen("home")}
              onSave={save}
              isGuest={guestMode && !user}
              onSelectPlan={handleGuestSelectPlan}
            />
          )}

          {screen === "journal" && (
            <JournalScreen profile={profile} />
          )}

          {screen === "viewSaved" && viewItem && (
            <SavedView item={viewItem} onBack={() => setScreen("journal")} />
          )}

          {screen === "foryou" && (
            <ForYouScreen
              profile={profile}
              recentSearches={recentSearches}
              savedItems={savedItems}
              onNav={nav}
              onSearch={suggest}
            />
          )}

          {screen === "profile" && (
            <ProfileScreen
              profile={profile}
              onSave={saveProfile}
              onLogout={logout}
              userEmail={user?.email}
            />
          )}
        </PageWrap>
      </AnimatePresence>

      {/* Guest paywall */}
      {showPaywall && (
        <GuestPaywall
          onCreateAccount={() => {
            setShowPaywall(false);
            handleGuestSignUp();
          }}
          onSelectPlan={() => {
            setShowPaywall(false);
            handleGuestSelectPlan();
          }}
        />
      )}

      <NavBar screen={activeNav} onNav={nav} isGuest={guestMode && !user} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
