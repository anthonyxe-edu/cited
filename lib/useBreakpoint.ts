"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide";

export interface BreakpointInfo {
  width: number;
  height: number;
  bp: Breakpoint;
  isMobile: boolean;   // < 768
  isTablet: boolean;   // 768–1023
  isDesktop: boolean;  // >= 1024
  isWide: boolean;     // >= 1440
  ready: boolean;      // false until first measurement (avoids SSR mismatch)
}

const DEFAULT: BreakpointInfo = {
  width: 0, height: 0, bp: "mobile",
  isMobile: true, isTablet: false, isDesktop: false, isWide: false,
  ready: false,
};

export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(DEFAULT);

  useEffect(() => {
    function measure() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const bp: Breakpoint =
        w >= 1440 ? "wide" :
        w >= 1024 ? "desktop" :
        w >= 768  ? "tablet" : "mobile";
      setInfo({
        width: w, height: h, bp,
        isMobile:  bp === "mobile",
        isTablet:  bp === "tablet",
        isDesktop: bp === "desktop" || bp === "wide",
        isWide:    bp === "wide",
        ready: true,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return info;
}
