"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
    // If guest already used their free search, prompt sign-up
    if (guestMode && !user && guestSearchDone) {
      setGuestMode(false);
      setShowLanding(false);
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
    if (showLanding) {
      return <LandingScreen onSelectPlan={handleSelectPlan} onSearch={handleLandingSearch} initialView={landingInitialView} onSignIn={() => setShowLanding(false)} />;
    }
    return <AuthScreen onAuthed={() => {}} />;
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

      {screen === "home" && (
        <HomeScreen
          onSearch={search}
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

      <NavBar screen={activeNav} onNav={nav} />
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
