import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "adminDashboard",
      filename: "remoteEntry.js",
      exposes: {
        "./DashboardIndex": "./src/DashboardIndex.jsx",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: "^18.2.0",
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.2.0",
        },
        "react-router-dom": {
          singleton: true,
          requiredVersion: "^6.22.0",
        },
      },
    }),
  ],
  base: "/",
  server: {
    port: 5001,
  },
  preview: {
    port: 5001,
  },
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: true,
  },
});
