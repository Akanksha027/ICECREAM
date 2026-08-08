import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blush: "#F7D9DD",
        cream: "#FAECE5",
        brown: "#553C38",
        coral: "#E77E86",
        mint: "#DBE9D9",
        yellow: "#F5E1AB",
        berry: "#980B39",
        raspberry: "#7E062E",
        "bright-raspberry": "#C51C50",
        gold: "#FFD49E",
        "showcase-cream": "#FFF8F2",
        "drip-edge": "#F7D9DD",
        ticker: "#F5C4C7",
        "muted-brown": "#82645F",
        border: "#EAD6CE",
        polaroid: "#FFFFFF",
        highlight: "#E8B9B7",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-jakarta)", "sans-serif"],
        script: ["var(--font-caveat)", "cursive"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(3deg)" },
        },
        drip: {
          "0%,100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(1.08)" },
        },
      },
      animation: {
        marquee: "marquee 26s linear infinite",
        float: "float 6s ease-in-out infinite",
        drip: "drip 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
