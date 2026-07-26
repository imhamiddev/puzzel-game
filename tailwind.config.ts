import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        surface2: "#1a1a26",
        border: "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#7c5cff",
          50: "#f2efff",
          100: "#e4ddff",
          200: "#c9bbff",
          300: "#a894ff",
          400: "#8f74ff",
          500: "#7c5cff",
          600: "#6a45f0",
          700: "#5936c9",
          800: "#4629a0",
          900: "#372080",
        },
        accent: {
          DEFAULT: "#00e5c7",
          light: "#5ffbe4",
        },
        gold: "#ffd166",
        silver: "#c9d1d9",
        bronze: "#e0946b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(124,92,255,0.35) 0%, rgba(10,10,15,0) 70%)",
        "primary-gradient": "linear-gradient(135deg, #7c5cff 0%, #5936c9 100%)",
        "accent-gradient": "linear-gradient(135deg, #00e5c7 0%, #00b3a0 100%)",
        "gold-gradient": "linear-gradient(135deg, #ffe08a 0%, #ffb347 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,92,255,0.35)",
        "glow-sm": "0 0 20px rgba(124,92,255,0.25)",
        card: "0 8px 32px rgba(0,0,0,0.45)",
        "card-lg": "0 20px 60px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "count-pop": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "scale-in": "scale-in 0.25s ease-out",
        "count-pop": "count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)",
      },
    },
  },
  plugins: [],
};
export default config;
