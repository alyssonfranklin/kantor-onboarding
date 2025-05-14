import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * 
 * This file defines the custom color palette and theme settings for the
 * application, configured to work with shadcn/ui components.
 */

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Primary colors (orange/red)
        primary: {
          50: "#FFF3EF",
          100: "#FFE4D9",
          200: "#FFC7B3",
          300: "#FFA98D",
          400: "#FF8C66",
          500: "#E64A19", // Main brand color
          600: "#C53B16",
          700: "#A42C13",
          800: "#841E10",
          900: "#63150C",
          950: "#420C05",
        },
        
        // Secondary colors (purple)
        secondary: {
          50: "#F5F0FF",
          100: "#EBDCFF",
          200: "#D7B9FF",
          300: "#C396FF",
          400: "#AF73FF",
          500: "#6B21A8", // Secondary brand color
          600: "#581A8B",
          700: "#45136D",
          800: "#330C50",
          900: "#210632",
          950: "#100318",
        },
        
        // Gray scale
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#030712",
        },
        
        // Success colors (green)
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // Main success color
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },
        
        // Warning colors (amber)
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B", // Main warning color
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        
        // Error colors (red)
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444", // Main error color
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },
        
        // Semantic aliases for shadcn/ui
        background: {
          DEFAULT: "white",
          secondary: "hsl(var(--gray-50))",
          tertiary: "hsl(var(--gray-100))"
        },
        foreground: {
          DEFAULT: "hsl(var(--gray-900))",
        },
        card: {
          DEFAULT: "white",
          foreground: "hsl(var(--gray-900))",
        },
        popover: {
          DEFAULT: "white",
          foreground: "hsl(var(--gray-900))",
        },
        muted: {
          DEFAULT: "hsl(var(--gray-100))",
          foreground: "hsl(var(--gray-500))",
        },
        accent: {
          DEFAULT: "hsl(var(--gray-100))",
          foreground: "hsl(var(--primary-500))",
        },
        destructive: {
          DEFAULT: "hsl(var(--error-500))",
          foreground: "white",
        },
        border: {
          DEFAULT: "hsl(var(--gray-200))",
        },
        input: {
          DEFAULT: "hsl(var(--gray-200))",
        },
        ring: {
          DEFAULT: "hsl(var(--primary-500))",
        },
      },
      // CSS variables for the color system
      // This enables both direct color classes and semantic aliases
      // through CSS variables
      cssVariables: {
        "--primary-50": "#FFF3EF",
        "--primary-100": "#FFE4D9",
        "--primary-200": "#FFC7B3",
        "--primary-300": "#FFA98D",
        "--primary-400": "#FF8C66",
        "--primary-500": "#E64A19",
        "--primary-600": "#C53B16",
        "--primary-700": "#A42C13",
        "--primary-800": "#841E10",
        "--primary-900": "#63150C",
        "--primary-950": "#420C05",
        
        "--secondary-50": "#F5F0FF",
        "--secondary-100": "#EBDCFF",
        "--secondary-200": "#D7B9FF",
        "--secondary-300": "#C396FF",
        "--secondary-400": "#AF73FF",
        "--secondary-500": "#6B21A8",
        "--secondary-600": "#581A8B",
        "--secondary-700": "#45136D",
        "--secondary-800": "#330C50",
        "--secondary-900": "#210632",
        "--secondary-950": "#100318",
        
        "--gray-50": "#F9FAFB",
        "--gray-100": "#F3F4F6",
        "--gray-200": "#E5E7EB",
        "--gray-300": "#D1D5DB",
        "--gray-400": "#9CA3AF",
        "--gray-500": "#6B7280",
        "--gray-600": "#4B5563",
        "--gray-700": "#374151",
        "--gray-800": "#1F2937",
        "--gray-900": "#111827",
        "--gray-950": "#030712",
        
        "--success-50": "#ECFDF5",
        "--success-100": "#D1FAE5",
        "--success-200": "#A7F3D0",
        "--success-300": "#6EE7B7",
        "--success-400": "#34D399",
        "--success-500": "#10B981",
        "--success-600": "#059669",
        "--success-700": "#047857",
        "--success-800": "#065F46",
        "--success-900": "#064E3B",
        "--success-950": "#022C22",
        
        "--warning-50": "#FFFBEB",
        "--warning-100": "#FEF3C7",
        "--warning-200": "#FDE68A",
        "--warning-300": "#FCD34D",
        "--warning-400": "#FBBF24",
        "--warning-500": "#F59E0B",
        "--warning-600": "#D97706",
        "--warning-700": "#B45309",
        "--warning-800": "#92400E",
        "--warning-900": "#78350F",
        "--warning-950": "#451A03",
        
        "--error-50": "#FEF2F2",
        "--error-100": "#FEE2E2",
        "--error-200": "#FECACA",
        "--error-300": "#FCA5A5",
        "--error-400": "#F87171",
        "--error-500": "#EF4444",
        "--error-600": "#DC2626",
        "--error-700": "#B91C1C",
        "--error-800": "#991B1B",
        "--error-900": "#7F1D1D",
        "--error-950": "#450A0A",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;