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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#0a0a0f",
        "ink-soft": "#1a1a24",
        muted: "#6b6b7b",
        violet: "#6d5dfc",
        "violet-deep": "#4f3df5",
        sky: "#35b7ff",
        mint: "#d8ff45",
        paper: "#faf8f4",
        clay: "#e8e2d8",
        coral: "#ff6948",
        gold: "#f5c842"
      },
      boxShadow: {
        soft: "0 8px 40px rgba(10, 10, 15, 0.1)",
        hard: "0 12px 0 rgba(10, 10, 15, 1)",
        card: "0 2px 12px rgba(10, 10, 15, 0.06)",
        glow: "0 0 60px rgba(255, 105, 72, 0.25)",
        "glow-violet": "0 0 80px rgba(109, 93, 252, 0.3)",
        "glow-mint": "0 0 50px rgba(216, 255, 69, 0.2)",
        premium: "0 24px 80px rgba(10, 10, 15, 0.12), 0 0 0 1px rgba(255,255,255,0.06) inset"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" }
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(2deg)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" }
        },
        revealUp: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" }
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-glow": "pulseGlow 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "reveal-up": "revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spinSlow 24s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "scale-in": "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-right": "slideRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }
    }
  },
  plugins: []
};

export default config;
