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
        ink: "#F5F7FB",
        "ink-soft": "#12161F",
        muted: "#96A0B5",
        accent: "#7CFF6B",
        mint: "#7CFF6B",
        violet: "#8C7BFF",
        cyan: "#6EDCFF",
        sand: "#1A2130",
        paper: "#0B0D12",
        "paper-alt": "#12161F",
        clay: "rgba(255,255,255,0.08)",
        card: "#171C26"
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
        soft: "0 24px 80px rgba(0, 0, 0, 0.36)",
        card: "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 60px rgba(0,0,0,0.22)"
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
