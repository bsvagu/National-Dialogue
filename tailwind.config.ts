import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Material Design 3 corner radius tokens
        "md-none": "var(--md-sys-shape-corner-none)",
        "md-xs": "var(--md-sys-shape-corner-extra-small)",
        "md-sm": "var(--md-sys-shape-corner-small)",
        "md-base": "var(--md-sys-shape-corner-medium)",
        "md-lg": "var(--md-sys-shape-corner-large)",
        "md-xl": "var(--md-sys-shape-corner-extra-large)",
        "md-full": "var(--md-sys-shape-corner-full)",
      },
      colors: {
        // Legacy color mappings for existing components
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        // Material Design 3 System Color Tokens
        "md-primary": {
          DEFAULT: "var(--md-sys-color-primary)",
          on: "var(--md-sys-color-on-primary)",
          container: "var(--md-sys-color-primary-container)",
          "on-container": "var(--md-sys-color-on-primary-container)",
        },
        "md-secondary": {
          DEFAULT: "var(--md-sys-color-secondary)",
          on: "var(--md-sys-color-on-secondary)",
          container: "var(--md-sys-color-secondary-container)",
          "on-container": "var(--md-sys-color-on-secondary-container)",
        },
        "md-tertiary": {
          DEFAULT: "var(--md-sys-color-tertiary)",
          on: "var(--md-sys-color-on-tertiary)",
          container: "var(--md-sys-color-tertiary-container)",
          "on-container": "var(--md-sys-color-on-tertiary-container)",
        },
        "md-error": {
          DEFAULT: "var(--md-sys-color-error)",
          on: "var(--md-sys-color-on-error)",
          container: "var(--md-sys-color-error-container)",
          "on-container": "var(--md-sys-color-on-error-container)",
        },
        "md-surface": {
          DEFAULT: "var(--md-sys-color-surface)",
          on: "var(--md-sys-color-on-surface)",
          variant: "var(--md-sys-color-surface-variant)",
          "on-variant": "var(--md-sys-color-on-surface-variant)",
          dim: "var(--md-sys-color-surface-dim)",
          bright: "var(--md-sys-color-surface-bright)",
          "container-lowest": "var(--md-sys-color-surface-container-lowest)",
          "container-low": "var(--md-sys-color-surface-container-low)",
          container: "var(--md-sys-color-surface-container)",
          "container-high": "var(--md-sys-color-surface-container-high)",
          "container-highest": "var(--md-sys-color-surface-container-highest)",
        },
        "md-background": {
          DEFAULT: "var(--md-sys-color-background)",
          on: "var(--md-sys-color-on-background)",
        },
        "md-outline": {
          DEFAULT: "var(--md-sys-color-outline)",
          variant: "var(--md-sys-color-outline-variant)",
        },
        "md-shadow": "var(--md-sys-color-shadow)",
        "md-scrim": "var(--md-sys-color-scrim)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["Georgia", "serif"],
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
        // Material Design 3 typography tokens
        roboto: ["var(--md-sys-typescale-body-large-font)"],
      },
      fontSize: {
        // Material Design 3 typography scale
        "md-display-large": ["var(--md-sys-typescale-display-large-size)", { lineHeight: "var(--md-sys-typescale-display-large-line-height)", fontWeight: "var(--md-sys-typescale-display-large-weight)" }],
        "md-display-medium": ["var(--md-sys-typescale-display-medium-size)", { lineHeight: "var(--md-sys-typescale-display-medium-line-height)", fontWeight: "var(--md-sys-typescale-display-medium-weight)" }],
        "md-display-small": ["var(--md-sys-typescale-display-small-size)", { lineHeight: "var(--md-sys-typescale-display-small-line-height)", fontWeight: "var(--md-sys-typescale-display-small-weight)" }],
        "md-headline-large": ["var(--md-sys-typescale-headline-large-size)", { lineHeight: "var(--md-sys-typescale-headline-large-line-height)", fontWeight: "var(--md-sys-typescale-headline-large-weight)" }],
        "md-headline-medium": ["var(--md-sys-typescale-headline-medium-size)", { lineHeight: "var(--md-sys-typescale-headline-medium-line-height)", fontWeight: "var(--md-sys-typescale-headline-medium-weight)" }],
        "md-headline-small": ["var(--md-sys-typescale-headline-small-size)", { lineHeight: "var(--md-sys-typescale-headline-small-line-height)", fontWeight: "var(--md-sys-typescale-headline-small-weight)" }],
        "md-title-large": ["var(--md-sys-typescale-title-large-size)", { lineHeight: "var(--md-sys-typescale-title-large-line-height)", fontWeight: "var(--md-sys-typescale-title-large-weight)" }],
        "md-title-medium": ["var(--md-sys-typescale-title-medium-size)", { lineHeight: "var(--md-sys-typescale-title-medium-line-height)", fontWeight: "var(--md-sys-typescale-title-medium-weight)" }],
        "md-title-small": ["var(--md-sys-typescale-title-small-size)", { lineHeight: "var(--md-sys-typescale-title-small-line-height)", fontWeight: "var(--md-sys-typescale-title-small-weight)" }],
        "md-body-large": ["var(--md-sys-typescale-body-large-size)", { lineHeight: "var(--md-sys-typescale-body-large-line-height)", fontWeight: "var(--md-sys-typescale-body-large-weight)" }],
        "md-body-medium": ["var(--md-sys-typescale-body-medium-size)", { lineHeight: "var(--md-sys-typescale-body-medium-line-height)", fontWeight: "var(--md-sys-typescale-body-medium-weight)" }],
        "md-body-small": ["var(--md-sys-typescale-body-small-size)", { lineHeight: "var(--md-sys-typescale-body-small-line-height)", fontWeight: "var(--md-sys-typescale-body-small-weight)" }],
        "md-label-large": ["var(--md-sys-typescale-label-large-size)", { lineHeight: "var(--md-sys-typescale-label-large-line-height)", fontWeight: "var(--md-sys-typescale-label-large-weight)" }],
        "md-label-medium": ["var(--md-sys-typescale-label-medium-size)", { lineHeight: "var(--md-sys-typescale-label-medium-line-height)", fontWeight: "var(--md-sys-typescale-label-medium-weight)" }],
        "md-label-small": ["var(--md-sys-typescale-label-small-size)", { lineHeight: "var(--md-sys-typescale-label-small-line-height)", fontWeight: "var(--md-sys-typescale-label-small-weight)" }],
      },
      boxShadow: {
        // Material Design 3 elevation tokens
        "md-0": "var(--md-sys-elevation-level0)",
        "md-1": "var(--md-sys-elevation-level1)",
        "md-2": "var(--md-sys-elevation-level2)",
        "md-3": "var(--md-sys-elevation-level3)",
        "md-4": "var(--md-sys-elevation-level4)",
        "md-5": "var(--md-sys-elevation-level5)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
