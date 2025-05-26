import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  important: true,
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(260, 100%, 85%)", // Soft lavender
          foreground: "hsl(240, 10%, 10%)",
        },
        secondary: {
          DEFAULT: "hsl(260, 80%, 90%)",
          foreground: "hsl(240, 10%, 10%)",
        },
        accent: {
          DEFAULT: "hsl(339, 100%, 85%)", // Pale rose
          foreground: "hsl(240, 10%, 10%)",
        },
        background: "hsl(240, 13%, 95%)", // Light background
        foreground: "hsl(240, 10%, 10%)", // Light foreground
        muted: {
          DEFAULT: "hsl(240, 13%, 90%)",
          foreground: "hsl(240, 10%, 40%)",
        },
        card: {
          DEFAULT: "hsl(240, 13%, 95%)",
          foreground: "hsl(240, 10%, 10%)",
        },
        popover: {
          DEFAULT: "hsl(240, 13%, 95%)",
          foreground: "hsl(240, 10%, 10%)",
        },
        border: "hsl(240, 13%, 85%)",
        input: "hsl(240, 13%, 85%)",
        ring: "hsl(260, 100%, 80%)",
        destructive: {
          DEFAULT: "hsl(0, 100%, 70%)",
          foreground: "hsl(0, 0%, 98%)",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist)"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
