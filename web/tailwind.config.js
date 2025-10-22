/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
      },
      colors: {
        base: {
          900: "#040910",
          800: "#0A1626",
          700: "#11263C",
        },
        accent: {
          purple: "#38BDF8",
          cyan: "#F97316",
          pink: "#6366F1",
        },
        glass: "rgba(15,23,42,0.7)",
      },
      backgroundImage: {
        "aurora-gradient":
          "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.28), transparent 45%), radial-gradient(circle at 85% 10%, rgba(249,115,22,0.22), transparent 50%), radial-gradient(circle at 40% 110%, rgba(99,102,241,0.25), transparent 50%)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(56,189,248,0.45)",
        panel: "0 16px 40px rgba(0,0,0,0.35)",
      },
      animation: {
        pulseSlow: "pulseSlow 3.2s ease-in-out infinite",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: 0.55, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
