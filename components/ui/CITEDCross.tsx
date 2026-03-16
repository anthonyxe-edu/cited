"use client";

import React, { useEffect, useRef } from "react";

interface CITEDCrossProps {
  size?: number;
}

const CLR = {
  frontTop:  "#00E5B5",
  front:     "#00D4AA",
  frontBot:  "#00B894",
  top:       "#00C9A0",
  side:      "#009E7A",
  bottom:    "#006B54",
  back:      "#004D3D",
  inner:     "#002E22",
};

export function CITEDCross({ size = 200 }: CITEDCrossProps) {
  const assemblyRef = useRef<HTMLDivElement>(null);
  const frameRef    = useRef<number>(0);
  const startRef    = useRef<number | null>(null);

  const S  = size;
  const T  = Math.round(S * 0.32);   // bar thickness
  const D  = Math.round(T * 0.54);   // z-depth (chunky)
  const hD = D / 2;
  const a  = Math.round((S - T) / 2); // inner corner offset

  useEffect(() => {
    function animate(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const ry = ((ts - startRef.current) / 1000 * 36) % 360;
      if (assemblyRef.current) {
        assemblyRef.current.style.transform = `rotateX(22deg) rotateY(${ry}deg)`;
      }
      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  // Cross shape as a 12-point polygon
  const crossPath = [
    `${a}px 0px`,
    `${a + T}px 0px`,
    `${a + T}px ${a}px`,
    `${S}px ${a}px`,
    `${S}px ${a + T}px`,
    `${a + T}px ${a + T}px`,
    `${a + T}px ${S}px`,
    `${a}px ${S}px`,
    `${a}px ${a + T}px`,
    `0px ${a + T}px`,
    `0px ${a}px`,
    `${a}px ${a}px`,
  ].join(", ");

  // Panel helpers — each rotates from its shared edge with the cross face
  // All transforms: CSS applies right-to-left, so inner transform runs first
  type P = React.CSSProperties;

  // Top face: panel sits above (y = y_top), rotates up from bottom edge
  const topP = (x: number, y: number, w: number, clr: string): P => ({
    position: "absolute", left: x, top: y - D, width: w, height: D,
    background: clr, backfaceVisibility: "hidden",
    transformOrigin: "center bottom",
    transform: `translateZ(${-hD}px) rotateX(-90deg)`,
  });

  // Bottom face: panel sits below (y = y_bottom), rotates down from top edge
  const botP = (x: number, y: number, w: number, clr: string): P => ({
    position: "absolute", left: x, top: y, width: w, height: D,
    background: clr, backfaceVisibility: "hidden",
    transformOrigin: "center top",
    transform: `translateZ(${-hD}px) rotateX(90deg)`,
  });

  // Right face: panel sits at right edge (x = x_right), rotates rightward from left edge
  const rgtP = (x: number, y: number, h: number, clr: string): P => ({
    position: "absolute", left: x, top: y, width: D, height: h,
    background: clr, backfaceVisibility: "hidden",
    transformOrigin: "left center",
    transform: `translateZ(${-hD}px) rotateY(-90deg)`,
  });

  // Left face: panel sits at left edge (x = x_left), rotates leftward from right edge
  const lftP = (x: number, y: number, h: number, clr: string): P => ({
    position: "absolute", left: x - D, top: y, width: D, height: h,
    background: clr, backfaceVisibility: "hidden",
    transformOrigin: "right center",
    transform: `translateZ(${-hD}px) rotateY(90deg)`,
  });

  const panels: P[] = [
    // Top faces (lit from above — brightest)
    topP(a,     0,     T, CLR.top),
    topP(a + T, a,     a, CLR.top),
    topP(0,     a,     a, CLR.top),

    // Bottom faces (in shadow — darkest)
    botP(a,     S,     T, CLR.bottom),
    botP(a + T, a + T, a, CLR.bottom),
    botP(0,     a + T, a, CLR.bottom),

    // Outer side faces
    rgtP(S,     a,     T, CLR.side),
    lftP(0,     a,     T, CLR.side),

    // Inner notch faces (concave corners — very dark)
    rgtP(a + T, 0,     a, CLR.inner),
    rgtP(a + T, a + T, a, CLR.inner),
    lftP(a,     0,     a, CLR.inner),
    lftP(a,     a + T, a, CLR.inner),
  ];

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      perspective: size * 6,
      pointerEvents: "none",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute",
        inset: "-20%",
        background: "radial-gradient(circle at 45% 45%, rgba(0,212,170,0.18) 0%, transparent 60%)",
        filter: "blur(16px)",
        pointerEvents: "none",
      }} />

      {/* 3D assembly */}
      <div
        ref={assemblyRef}
        style={{
          width: S, height: S,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(22deg) rotateY(0deg)",
          filter: "drop-shadow(0 24px 48px rgba(0,212,170,0.5))",
        }}
      >
        {/* Front face */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(145deg, ${CLR.frontTop} 0%, ${CLR.front} 45%, ${CLR.frontBot} 100%)`,
          clipPath: `polygon(${crossPath})`,
          transform: `translateZ(${hD}px)`,
          backfaceVisibility: "hidden",
        }} />

        {/* Back face — faces backward, visible when cross is flipped */}
        <div style={{
          position: "absolute", inset: 0,
          background: CLR.back,
          clipPath: `polygon(${crossPath})`,
          transform: `rotateY(180deg) translateZ(${hD}px)`,
          backfaceVisibility: "hidden",
        }} />

        {/* 12 side panels */}
        {panels.map((s, i) => <div key={i} style={s} />)}
      </div>
    </div>
  );
}
