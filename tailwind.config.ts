import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-unbounded)", "var(--font-inter)", "system-ui", "sans-serif"],
        fairy: ["var(--font-fairy-display)", "Georgia", "serif"],
        "fairy-body": ["var(--font-fairy-body)", "Georgia", "serif"]
      },
      colors: {
        ink: "#1C1C1C",
        "ink-soft": "#2A2A2A",
        muted: "#5C5C66",
        accent: {
          DEFAULT: "#BFF93F",
          ink: "#3F6B00",
          soft: "#EFF9D9"
        },
        mint: "#BFF93F",
        pink: "#FF73DB",
        "on-accent": "#1C1C1C",
        violet: "#8C7BFF",
        cyan: "#6EDCFF",
        sand: "#F3F3F0",
        paper: "#F7F7F5",
        "paper-alt": "#F0F0EE",
        clay: "rgba(28,28,28,0.08)",
        card: "#FFFFFF",
        gold: "#D4B483",
        moon: "#F3EBE0",
        mist: "#7D9AA3",
        blush: "#C4A4A8",
        night: "#070B14"
      },
      maxWidth: {
        content: "1280px"
      },
      borderRadius: {
        container: "28px",
        card: "18px",
        button: "999px"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(28, 28, 28, 0.08)",
        card: "0 12px 40px rgba(28, 28, 28, 0.06)"
      },
      keyframes: {
        revealUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" }
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "200% center" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        },
        auroraDrift: {
          "0%": { transform: "translateX(-8%) rotate(0deg)" },
          "50%": { transform: "translateX(8%) rotate(2deg)" },
          "100%": { transform: "translateX(-8%) rotate(0deg)" }
        },
        fogDrift: {
          "0%": { transform: "translateX(-4%)" },
          "100%": { transform: "translateX(4%)" }
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.96)" },
          "50%": { opacity: "0.7", transform: "scale(1.04)" }
        },
        heroBlobOrbit: {
          "0%": { transform: "translate3d(var(--orb-x), 0, 0) rotate(0deg)" },
          "25%": { transform: "translate3d(0, var(--orb-y), 0) rotate(90deg)" },
          "50%": { transform: "translate3d(calc(var(--orb-x) * -1), 0, 0) rotate(180deg)" },
          "75%": { transform: "translate3d(0, calc(var(--orb-y) * -1), 0) rotate(270deg)" },
          "100%": { transform: "translate3d(var(--orb-x), 0, 0) rotate(360deg)" }
        },
        progressFill: {
          from: { width: "0%" },
          to: { width: "100%" }
        }
      },
      animation: {
        "reveal-up": "revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 4s linear infinite",
        float: "float 5s ease-in-out infinite",
        twinkle: "twinkle 3.2s ease-in-out infinite",
        "aurora-drift": "auroraDrift 18s ease-in-out infinite",
        "fog-drift": "fogDrift 22s ease-in-out infinite alternate",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        "hero-blob": "heroBlobOrbit 18s linear infinite",
        "progress-fill": "progressFill 1.4s ease-out forwards"
      }
    }
  },
  plugins: []
};

export default config;
