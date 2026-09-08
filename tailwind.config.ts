import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F1F6FD",
        foreground: "#0F172A",
        surface: {
          DEFAULT: "#FFFFFF",
          card: "#FFFFFF",
          hover: "#F0F7FF",
          muted: "#F8FAFC",
          border: "#E2E8F0",
          highlight: "#E0EDFB",
        },
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          muted: "rgba(37, 99, 235, 0.08)",
          foreground: "#FFFFFF",
        },
        automotive: {
          gold: "#2563EB",
          amber: "#F59E0B",
          dark: "#0F172A",
          card: "#FFFFFF",
          border: "#E2E8F0",
          metallic: "#64748B",
          red: "#EF4444",
          green: "#10B981",
          blue: "#2563EB",
          sky: "#0284C7",
          ice: "#EFF6FF",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#0284C7",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["monospace"],
      },
      boxShadow: {
        glow: "0 4px 20px -2px rgba(37, 99, 235, 0.25)",
        card: "0 2px 12px -2px rgba(30, 58, 138, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(37, 99, 235, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
