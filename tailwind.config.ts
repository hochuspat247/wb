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
        ink: "#111111",
        "ink-soft": "#1E1E1E",
        muted: "#746D63",
        accent: "#FF5638",
        mint: "#C8FF3D",
        sand: "#ECE3D2",
        paper: "#F3EFE7",
        "paper-alt": "#ECE3D2",
        clay: "#DDD4C8",
        card: "#FFFFFF"
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
        soft: "0 18px 60px rgba(17, 17, 17, 0.08)",
        card: "0 1px 0 rgba(17, 17, 17, 0.04)"
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
        }
      },
      animation: {
        "reveal-up": "revealUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
