/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════
        // CYBERPUNK COLOR PALETTE
        // ═══════════════════════════════════════════════════════════════
        cyber: {
          bg: "#06080f",
          card: "rgba(12, 18, 35, 0.85)",
          "card-hover": "rgba(18, 28, 55, 0.9)",
          input: "rgba(8, 14, 28, 0.9)",
        },
        neon: {
          cyan: "#00f0ff",
          "cyan-dim": "rgba(0, 240, 255, 0.6)",
          magenta: "#ff2eaa",
          "magenta-dim": "rgba(255, 46, 170, 0.6)",
          green: "#00ff88",
          red: "#ff4466",
          yellow: "#ffcc00",
        },
        txt: {
          primary: "#e0e8f8",
          secondary: "rgba(180, 200, 230, 0.6)",
          muted: "rgba(140, 160, 190, 0.4)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "Rajdhani", "sans-serif"],
        body: ["Rajdhani", "Exo 2", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "SF Mono", "monospace"],
      },
      borderColor: {
        cyber: "rgba(0, 240, 255, 0.12)",
        "cyber-hover": "rgba(0, 240, 255, 0.35)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "slide-in-left": "slideInLeft 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        "border-glow": "borderGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        scanline: {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100vh)" },
        },
        borderGlow: {
          "0%, 100%": { borderColor: "rgba(0,240,255,0.15)" },
          "50%": { borderColor: "rgba(0,240,255,0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
