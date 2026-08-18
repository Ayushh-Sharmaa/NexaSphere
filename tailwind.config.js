/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./website/src/**/*.{js,jsx,ts,tsx}",
    "./admin-dashboard/src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./website/index.html",
    "./admin-dashboard/index.html",
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode
        light: {
          bg: "#ffffff",
          surface: "#f3f4f6",
          text: "#111827",
          muted: "#6b7280",
          border: "#e5e7eb",
          primary: "#4f46e5",
        },
        // Dark mode
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          text: "#f1f5f9",
          muted: "#94a3b8",
          border: "#334155",
          primary: "#818cf8",
        },
      },
      transitionProperty: {
        theme: "background-color, color, border-color, fill, stroke",
      },
      transitionDuration: {
        theme: "300ms",
      },
      transitionTimingFunction: {
        theme: "ease-in-out",
      },
    },
  },
  plugins: [],
};
