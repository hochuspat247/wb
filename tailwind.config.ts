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
        "ink-soft": "#171717",
        muted: "#6F6A61",
        accent: "#FF5A3D",
        mint: "#B8FF3D",
        lavender: "#E8D8FF",
        paper: "#F7F4EF",
        "paper-alt": "#F8F6F2",
        clay: "#E8E1D8",
        card: "#FFFFFF"
      },
      maxWidth: {
        content: "1280px"
      },
      borderRadius: {
        container: "32px",
        card: "24px",
        button: "16px"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(17, 17, 17, 0.04), 0 8px 24px rgba(17, 17, 17, 0.04)",
        card: "0 1px 2px rgba(17, 17, 17, 0.03)"
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
