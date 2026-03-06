import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f8f6f1",
          foreground: "#f8f6f1",
          muted: "#888888",
        },
        accent: {
          DEFAULT: "#00a3c4",
          muted: "rgba(0, 163, 196, 0.6)",
          dim: "rgba(0, 163, 196, 0.35)",
          bright: "#00d4ff",
        },
        background: {
          DEFAULT: "#0a0a0a",
          elevated: "#1a1a1a",
          surface: "#141414",
        },
        border: {
          DEFAULT: "#333333",
          strong: "rgba(255, 255, 255, 0.15)",
        },
        semantic: {
          leaked: "#c44a00",
          "leaked-glow": "rgba(196, 74, 0, 0.4)",
          positive: "#42be65",
          negative: "#da1e28",
        },
        data: {
          hotelmap: "#00a3c4",
          agency: "#be95ff",
          duplos: "#f1c21b",
          links: "#ee5396",
          nothing: "#555555",
        },
        region: {
          apac: "#00a3c4",
          americas: "#f1c21b",
          europe: "#be95ff",
          imea: "#ee5396",
        },
      },
      borderRadius: {
        none: "0",
        xs: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 163, 196, 0.15)",
        "glow-sm": "0 0 12px rgba(0, 163, 196, 0.1)",
        "card-hover": "0 0 60px rgba(0, 163, 196, 0.12)",
        tooltip: "0 4px 20px rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.02em" }],
        "display-sm": ["2.25rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        h1: ["3rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        h2: ["2rem", { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.02em" }],
        h3: ["1.125rem", { lineHeight: "1.35", fontWeight: "700" }],
        body: ["0.9375rem", { lineHeight: "1.65" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.4" }],
        caption: ["0.75rem", { lineHeight: "1", fontWeight: "400", letterSpacing: "0.15em" }],
        "caption-muted": ["0.75rem", { lineHeight: "1" }],
        kpi: ["3rem", { lineHeight: "0.85", fontWeight: "700" }],
        "section-label": ["0.75rem", { lineHeight: "1", fontWeight: "400", letterSpacing: "0.3em" }],
        "stat-label": ["0.6875rem", { lineHeight: "1", fontWeight: "400", letterSpacing: "0.15em" }],
      },
      spacing: {
        section: "3rem",
        "section-lg": "100px",
      },
      maxWidth: {
        content: "1200px",
        body: "650px",
        chart: "900px",
      },
      transitionDuration: {
        hover: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
