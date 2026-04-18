import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/healthz': 'http://localhost:8787',
    },
  },
})
