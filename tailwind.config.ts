import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burnt: {
          DEFAULT: "#BF5700",
          light: "#D96C1A",
          dark: "#8B3D00",
        },
      },
      animation: {
        marquee: "marquee 12s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(-400px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
