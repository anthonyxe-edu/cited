"use client";

import React from "react";
import { motion } from "framer-motion";

interface LampGlowProps {
  /** The page background color — used to mask the beam edges */
  bgColor?: string;
}

/**
 * Decorative lamp/spotlight glow effect for the landing page hero.
 * Position this absolutely inside a `position:relative; overflow:hidden` container.
 */
export function LampGlow({ bgColor = "#0A1628" }: LampGlowProps) {
  const teal = "#00D4AA";
  const tealDim = "#00B894";

  return (
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 380,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        // Scale vertically to spread the beams wider — matches original scale-y-125
        transform: "scaleY(1.25)",
        transformOrigin: "top center",
      }}
    >
      {/* ── Left beam ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0.5, width: "15rem" }}
        animate={{ opacity: 1, width: "30rem" }}
        transition={{ delay: 0.25, duration: 0.9, ease: "easeInOut" }}
        style={{
          position: "absolute",
          right: "50%",
          top: 0,
          height: 224,
          backgroundImage: `conic-gradient(from 70deg at center top, ${teal}, transparent, transparent)`,
          overflow: "visible",
        }}
      >
        {/* bottom edge fade */}
        <div style={{ position: "absolute", width: "100%", left: 0, background: bgColor, height: 160, bottom: 0, zIndex: 20, WebkitMaskImage: "linear-gradient(to top, white, transparent)", maskImage: "linear-gradient(to top, white, transparent)" }} />
        {/* left edge fade */}
        <div style={{ position: "absolute", width: 160, height: "100%", left: 0, background: bgColor, bottom: 0, zIndex: 20, WebkitMaskImage: "linear-gradient(to right, white, transparent)", maskImage: "linear-gradient(to right, white, transparent)" }} />
      </motion.div>

      {/* ── Right beam (mirror) ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0.5, width: "15rem" }}
        animate={{ opacity: 1, width: "30rem" }}
        transition={{ delay: 0.25, duration: 0.9, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          height: 224,
          backgroundImage: `conic-gradient(from 290deg at center top, ${teal}, transparent, transparent)`,
          overflow: "visible",
        }}
      >
        {/* bottom edge fade */}
        <div style={{ position: "absolute", width: "100%", right: 0, background: bgColor, height: 160, bottom: 0, zIndex: 20, WebkitMaskImage: "linear-gradient(to top, white, transparent)", maskImage: "linear-gradient(to top, white, transparent)" }} />
        {/* right edge fade */}
        <div style={{ position: "absolute", width: 160, height: "100%", right: 0, background: bgColor, bottom: 0, zIndex: 20, WebkitMaskImage: "linear-gradient(to left, white, transparent)", maskImage: "linear-gradient(to left, white, transparent)" }} />
      </motion.div>

      {/* ── Background blur + bloom ──────────────────────────────────── */}
      {/* Upper half bg fill */}
      <div style={{ position: "absolute", top: "50%", height: 192, width: "100%", transform: "translateY(48px) scaleX(1.5)", background: bgColor, filter: "blur(40px)" }} />
      {/* Large soft bloom */}
      <div style={{ position: "absolute", top: "50%", zIndex: 50, height: 192, width: "100%", background: "transparent", opacity: 0.1, backdropFilter: "blur(12px)" }} />
      {/* Center bloom circle */}
      <div style={{ position: "absolute", inset: "auto", zIndex: 50, top: 0, left: "50%", transform: "translateX(-50%) translateY(-50%)", height: 144, width: 448, borderRadius: "50%", background: teal, opacity: 0.45, filter: "blur(48px)" }} />

      {/* ── Animated smaller bloom ─────────────────────────────────────── */}
      <motion.div
        initial={{ width: "8rem" }}
        animate={{ width: "16rem" }}
        transition={{ delay: 0.25, duration: 0.9, ease: "easeInOut" }}
        style={{ position: "absolute", inset: "auto", zIndex: 30, top: 0, left: "50%", transform: "translateX(-50%) translateY(-96px)", height: 144, borderRadius: "50%", background: tealDim, filter: "blur(32px)" }}
      />

      {/* ── Horizontal bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ width: "15rem" }}
        animate={{ width: "30rem" }}
        transition={{ delay: 0.25, duration: 0.9, ease: "easeInOut" }}
        style={{ position: "absolute", inset: "auto", zIndex: 50, left: "50%", transform: "translateX(-50%) translateY(-112px)", height: 2, borderRadius: 2, background: teal }}
      />

      {/* ── Top fill — hides anything above the bar ─────────────────────── */}
      <div style={{ position: "absolute", inset: "auto", zIndex: 40, height: 176, width: "100%", transform: "translateY(-200px)", background: bgColor }} />
    </div>
  );
}
