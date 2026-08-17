import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/main.jsx",
      ],
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70,
    },
    include: ["src/**/*.test.{ts,tsx,js,jsx}", "src/**/*.spec.{ts,tsx,js,jsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      react: path.resolve(import.meta.dirname, "../node_modules/react"),
      "react-dom": path.resolve(
        import.meta.dirname,
        "../node_modules/react-dom"
      ),
    },
  },
});
