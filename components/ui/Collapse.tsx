"use client";

import React from "react";

interface CollapseProps {
  open: boolean;
  children: React.ReactNode;
}

/**
 * Smooth animated dropdown using CSS grid 0fr→1fr trick.
 * Works with unknown content height. No JS height measurement needed.
 */
export function Collapse({ open, children }: CollapseProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
