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
          900: "#050507",
          800: "#0E0E10",
          700: "#1A1A1E",
        },
        accent: {
          purple: "#8B5CF6",
          cyan: "#06B6D4",
          pink: "#EC4899",
        },
        glass: "rgba(22,22,29,0.75)",
      },
      backgroundImage: {
        "aurora-gradient":
          "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.28), transparent 40%), radial-gradient(circle at 80% 0%, rgba(6,182,212,0.25), transparent 45%), radial-gradient(circle at 50% 100%, rgba(236,72,153,0.22), transparent 50%)",
      },
      boxShadow: {
        glow: "0 0 35px rgba(139,92,246,0.45)",
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
