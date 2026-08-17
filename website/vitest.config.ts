import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__',
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/**/*.spec.{ts,tsx,js,jsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'next/image': path.resolve(import.meta.dirname, './src/shared/next-image.jsx'),
      'next/dynamic': path.resolve(import.meta.dirname, './src/shared/next-dynamic.jsx'),
      react: path.resolve(import.meta.dirname, '../node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, '../node_modules/react-dom'),
    },
  },
});
