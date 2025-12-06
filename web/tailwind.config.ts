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
        // Neon Cyber theme
        primary: {
          DEFAULT: "#FF00FF", // Magenta
          50: "#FFE5FF",
          100: "#FFCCFF",
          200: "#FF99FF",
          300: "#FF66FF",
          400: "#FF33FF",
          500: "#FF00FF",
          600: "#CC00CC",
          700: "#990099",
          800: "#660066",
          900: "#330033",
        },
        secondary: {
          DEFAULT: "#00FFFF", // Cyan
          50: "#E5FFFF",
          100: "#CCFFFF",
          200: "#99FFFF",
          300: "#66FFFF",
          400: "#33FFFF",
          500: "#00FFFF",
          600: "#00CCCC",
          700: "#009999",
          800: "#006666",
          900: "#003333",
        },
        accent: {
          DEFAULT: "#FFD700", // Gold
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#FFD700",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        dark: {
          DEFAULT: "#0A0A0F",
          50: "#1A1A2E",
          100: "#16162B",
          200: "#121228",
          300: "#0E0E25",
          400: "#0A0A22",
          500: "#0A0A0F",
          600: "#08080C",
          700: "#060609",
          800: "#040406",
          900: "#020203",
        },
        bonk: {
          DEFAULT: "#F7931A", // Orange for BONK
          light: "#FFB347",
          dark: "#CC7000",
        },
        wif: {
          DEFAULT: "#8B5CF6", // Purple for WIF
          light: "#A78BFA",
          dark: "#7C3AED",
        },
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": `
          linear-gradient(to right, rgba(255, 0, 255, 0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 0, 255, 0.1) 1px, transparent 1px)
        `,
        "glow-primary": "radial-gradient(circle, rgba(255, 0, 255, 0.3) 0%, transparent 70%)",
        "glow-secondary": "radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%)",
      },
      backgroundSize: {
        "cyber-grid": "50px 50px",
      },
      boxShadow: {
        "neon-primary": "0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)",
        "neon-secondary": "0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)",
        "neon-accent": "0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)",
        "neon-bonk": "0 0 20px rgba(247, 147, 26, 0.5), 0 0 40px rgba(247, 147, 26, 0.3)",
        "neon-wif": "0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "shake": "shake 0.5s ease-in-out",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(255, 0, 255, 0.5)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 0, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.4)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-10px)" },
          "75%": { transform: "translateX(10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
