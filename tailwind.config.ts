import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    borderRadius: {
      none: "0px",
      sm: "var(--radius-sm)",
      DEFAULT: "var(--radius-sm)",
      md: "var(--radius)",
      lg: "var(--radius-lg)",
      xl: "calc(var(--radius-lg) * 1.5)",
      "2xl": "calc(var(--radius-lg) * 2)",
      "3xl": "calc(var(--radius-lg) * 3)",
      pill: "var(--radius-pill)",
      // `full` måste vara en riktig cirkel – avatarer och prickar använder den.
      full: "var(--radius-pill)",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Orbitron", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // Märkesfärger, oberoende av ljus/mörkt läge
        brand: {
          cyan: "hsl(var(--brand-cyan))",
          "cyan-deep": "hsl(var(--brand-cyan-deep))",
          plum: "hsl(var(--brand-plum))",
          "plum-strong": "hsl(var(--brand-plum-strong))",
          "plum-light": "hsl(var(--brand-plum-light))",
          "plum-deep": "hsl(var(--brand-plum-deep))",
          black: "hsl(var(--brand-black))",
          "black-plum": "hsl(var(--brand-black-plum))",
          chassis: "hsl(var(--brand-chassis))",
        },
        tier: {
          start: "hsl(var(--tier-start))",
          core: "hsl(var(--tier-core))",
          elite: "hsl(var(--tier-elite))",
        },
        sale: "hsl(var(--sale))",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
