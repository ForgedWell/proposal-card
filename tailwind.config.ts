import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        sanctuary: {
          primary: "#466564",
          "primary-dim": "#3a5858",
          surface: "#fafaf5",
          "surface-low": "#f3f4ee",
          "surface-container": "#edefe8",
          "surface-high": "#e6e9e2",
          "surface-highest": "#e0e4dc",
          "surface-lowest": "#ffffff",
          outline: "#787c75",
          "outline-variant": "#afb3ac",
          "on-surface": "#2f342e",
          "on-surface-variant": "#5c605a",
          secondary: "#496273",
          "secondary-container": "#cce6fa",
          "on-secondary-container": "#3c5565",
          tertiary: "#9e4142",
          "tertiary-dim": "#8f3537",
          "on-tertiary": "#fff7f6",
          "primary-container": "#c7e9e8",
          "on-primary": "#e0fffe",
          error: "#a83836",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
        serif: ["Noto Serif", "Georgia", "Cambria", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
