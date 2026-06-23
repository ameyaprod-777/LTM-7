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
        anthracite: {
          DEFAULT: "#1a1d23",
          50: "#f4f5f6",
          100: "#e8eaec",
          200: "#c5cad1",
          300: "#a2aab6",
          400: "#5c6a7a",
          500: "#3d4a58",
          600: "#2d3540",
          700: "#242a33",
          800: "#1a1d23",
          900: "#12141a",
        },
        accent: {
          DEFAULT: "#2a5f9e",
          hover: "#3b6fae",
          muted: "#2a5f9e33",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
