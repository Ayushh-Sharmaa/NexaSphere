import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'apps/**/dist/',
      'build/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'node_modules/',
      'api/',
      'public/',
      'server/',
      'server-java/**',
      'server-python/**',
      'BACKEND_INTEGRATION_EXAMPLE*.js',
      'FRONTEND_INTEGRATION_EXAMPLE*.jsx',
      'google-apps-script/**',
      'scratch/**',
      "dist/",
      "build/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      "node_modules/",
      "api/",
      "public/",
      "server/",
      "server-java/**',
      "server-python/**",
      "admin-dashboard/**",
      "BACKEND_INTEGRATION_EXAMPLE*.js",
      "FRONTEND_INTEGRATION_EXAMPLE*.jsx",
      "google-apps-script/**",
      "scratch/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'website/src/**/*.{js,jsx,ts,tsx}', 'admin-dashboard/src/**/*.{js,jsx,ts,tsx}', 'e2e/**/*.{js,jsx,ts,tsx}', '*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'warn',
      'no-undef': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
);
