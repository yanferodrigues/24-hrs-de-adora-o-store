import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        "mute-2": "var(--mute-2)",
        accent: "var(--accent)",
        "accent-on": "var(--accent-on)",
        void: "var(--void)",
        parchment: "var(--parchment)",
        gold: "var(--gold)",
        "gold-lite": "var(--gold-lite)",
        "gold-deep": "var(--gold-deep)",
        blood: "var(--blood)",
        "blood-lite": "var(--blood-lite)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        wrap: "1240px",
      },
    },
  },
  plugins: [],
};

export default config;
