"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** "up" slides from below (default), "scale" scales in, "fade" just fades */
  variant?: "up" | "scale" | "fade";
}

const variants = {
  up: {
    hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
    visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px 0px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[variant]}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.8, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a list of children, staggering their reveal as they scroll into view */
export function ScrollRevealGroup({
  children,
  className,
  stagger = 0.08,
  variant = "up",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  variant?: "up" | "scale" | "fade";
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => (
        <ScrollReveal delay={i * stagger} variant={variant}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}
