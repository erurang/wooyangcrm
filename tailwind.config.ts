import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // CRM Design System
        crm: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          "accent-light": "var(--color-accent-light)",
          "accent-hover": "var(--color-accent-hover)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)",
          info: "var(--color-info)",
          surface: "var(--color-surface)",
          "surface-secondary": "var(--color-surface-secondary)",
          border: "var(--color-border)",
          "border-hover": "var(--color-border-hover)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
          hover: "var(--color-sidebar-hover)",
          active: "var(--color-sidebar-active)",
          text: "var(--color-sidebar-text)",
          "text-active": "var(--color-sidebar-text-active)",
        },
      },
      fontFamily: {
        nanum: ["NanumSquareNeo", "sans-serif"],
      },
      boxShadow: {
        "crm-sm": "var(--shadow-sm)",
        "crm-md": "var(--shadow-md)",
        "crm-lg": "var(--shadow-lg)",
        "crm-xl": "var(--shadow-xl)",
      },
      borderRadius: {
        "crm": "8px",
        "crm-lg": "12px",
        "crm-xl": "16px",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
} satisfies Config;
