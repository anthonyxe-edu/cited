"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, BookMarked, Compass, User } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useBreakpoint } from "@/lib/useBreakpoint";
import type { Screen } from "@/types";

const PRIMARY = "#00D4AA";

const items = [
  { id: "home"    as const, label: "Search",  Icon: Search     },
  { id: "journal" as const, label: "Journal", Icon: BookMarked },
  { id: "foryou"  as const, label: "For You", Icon: Compass    },
  { id: "profile" as const, label: "Profile", Icon: User       },
];

interface NavBarProps {
  screen: Screen;
  onNav: (s: Screen) => void;
}

export function NavBar({ screen, onNav }: NavBarProps) {
  const { C, isDark } = useTheme();
  const { isMobile, isDesktop, ready } = useBreakpoint();

  const navBg     = isDark ? "rgba(10,22,40,0.95)" : "rgba(240,253,250,0.95)";
  const navBorder = isDark ? "rgba(255,255,255,0.09)" : C.border;
  const inactive  = isDark ? "rgba(255,255,255,0.4)" : C.tt;

  const activeId: Screen =
    ["home", "context", "results"].includes(screen) ? "home" :
    screen === "viewSaved" ? "journal" :
    screen;

  // ── Desktop: vertical left sidebar ────────────────────────────────────────
  if (ready && isDesktop) {
    return (
      <div style={{
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        width: 220,
        background: navBg,
        borderRight: `1px solid ${navBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 14px 28px",
        zIndex: 100,
        boxShadow: "2px 0 24px rgba(0,0,0,0.25)",
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "4px 10px 28px",
          borderBottom: `1px solid ${navBorder}`,
          marginBottom: 20,
        }}>
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
            <rect x="31.5" y="0" width="37" height="100" rx="10" fill="url(#ng)"/>
            <rect x="0" y="31.5" width="100" height="37" rx="10" fill="url(#ng)"/>
            <defs>
              <linearGradient id="ng" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00E5B5"/>
                <stop offset="100%" stopColor="#00B894"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            fontSize: 17, fontWeight: 900, color: C.text,
            letterSpacing: "1.5px",
          }}>
            CI<span style={{ color: PRIMARY }}>+</span>ED
          </span>
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {items.map(({ id, label, Icon }) => {
            const isActive = activeId === id;
            return (
              <button
                key={id}
                onClick={() => onNav(id)}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  border: "none",
                  background: "none",
                  padding: 0,
                  borderRadius: 12,
                  fontFamily: "system-ui,-apple-system,sans-serif",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tubelight-pill"
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: 12,
                      background: "rgba(0,212,170,0.10)",
                      zIndex: 0,
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    {/* Left accent bar (desktop tubelight equivalent) */}
                    <div style={{
                      position: "absolute",
                      left: -14, top: "50%",
                      transform: "translateY(-50%)",
                      width: 3, height: 22,
                      background: PRIMARY,
                      borderRadius: "0 3px 3px 0",
                    }}>
                      <div style={{ position: "absolute", width: 12, height: 28, background: `${PRIMARY}30`, borderRadius: "50%", top: -3, left: 0, filter: "blur(5px)" }} />
                    </div>
                  </motion.div>
                )}

                <div style={{
                  position: "relative", zIndex: 1,
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px",
                  color: isActive ? PRIMARY : inactive,
                  fontSize: 14, fontWeight: isActive ? 700 : 500,
                  transition: "color 0.15s",
                }}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div style={{ padding: "0 10px", fontSize: 10, color: isDark ? "rgba(255,255,255,0.18)" : C.tt, fontFamily: "'Courier New',monospace", letterSpacing: "0.08em" }}>
          Nothing uncited.
        </div>
      </div>
    );
  }

  // ── Mobile / Tablet: floating pill at bottom ──────────────────────────────
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      paddingBottom: 16,
      width: "100%",
      maxWidth: 480,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: navBg,
        border: `1px solid ${navBorder}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "5px",
        borderRadius: 9999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        pointerEvents: "auto",
      }}>
        {items.map(({ id, label, Icon }) => {
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                position: "relative",
                cursor: "pointer",
                border: "none",
                background: "none",
                padding: 0,
                borderRadius: 9999,
                fontFamily: "system-ui,-apple-system,sans-serif",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tubelight-pill"
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: 9999,
                    background: "rgba(0,212,170,0.12)",
                    zIndex: 0,
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <div style={{
                    position: "absolute",
                    top: -6, left: "50%",
                    transform: "translateX(-50%)",
                    width: 28, height: 3,
                    background: PRIMARY,
                    borderRadius: "0 0 4px 4px",
                  }}>
                    <div style={{ position: "absolute", width: 44, height: 14, background: `${PRIMARY}30`, borderRadius: "50%", top: -4, left: -8, filter: "blur(6px)" }} />
                    <div style={{ position: "absolute", width: 28, height: 10, background: `${PRIMARY}25`, borderRadius: "50%", top: -2, left: 0, filter: "blur(4px)" }} />
                    <div style={{ position: "absolute", width: 14, height: 8,  background: `${PRIMARY}35`, borderRadius: "50%", top: 0,  left: 7, filter: "blur(3px)" }} />
                  </div>
                </motion.div>
              )}

              <div style={{
                position: "relative", zIndex: 1,
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "9px 16px" : "9px 20px",
                color: isActive ? PRIMARY : inactive,
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}>
                {isMobile ? (
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                ) : (
                  <><Icon size={16} strokeWidth={isActive ? 2.5 : 2} /><span>{label}</span></>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
