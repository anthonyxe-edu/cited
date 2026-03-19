import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00D4AA",
        "primary-dark": "#00B894",
        "primary-deep": "#0A1628",
        "primary-light": "#CCFBF1",
        accent: "#F59E0B",
        "accent-light": "#FEF3C7",
        success: "#10B981",
        error: "#EF4444",
        surface: "#FFFFFF",
        "surface-alt": "#F8FAFC",
        bg: "#F0FDFA",
        ts: "#475569",
        tt: "#94A3B8",
        border: "#E2E8F0",
        "border-light": "#F1F5F9",
      },
      animation: {
        "fade-up": "fadeUp 0.25s ease",
        breathe: "breathe 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        pulse: "pulse 1.4s ease-in-out infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-72%, -62%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%,-40%) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
