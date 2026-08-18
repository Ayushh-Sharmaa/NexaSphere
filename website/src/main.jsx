import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import { initializeSentry } from './utils/errorTracking.js';
import * as Sentry from '@sentry/react';
import { ThemeProvider } from './context/theme/ThemeProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { initSyncManager } from './utils/syncManager.js';
import reportWebVitals from './reportWebVitals.js';

// ── Sentry error tracking ─────────────────────────────────────────────────────
initializeSentry();

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandledrejection' },
  });
});

window.addEventListener('error', (event) => {
  Sentry.captureException(event.error, { tags: { type: 'uncaughterror' } });
});

import { SocketProvider } from './context/SocketContext';

// Apply saved theme before React renders — prevents flash of wrong theme
try {
  const savedTheme = localStorage.getItem('ns-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ── PWA Service Worker Registration ──────────────────────────────────────────
let _updateSW = null;

_updateSW = registerSW({
  onNeedRefresh() {
    if (import.meta.env.DEV) {
      console.log('[PWA] New service worker available — notifying UI.');
    }
    window.dispatchEvent(
      new CustomEvent('nexasphere:sw-update', { detail: { updateSW: _updateSW } })
    );
  },

  onOfflineReady() {
    if (import.meta.env.DEV) {
      console.log('[PWA] App is ready to work offline.');
    }
    window.dispatchEvent(new CustomEvent('nexasphere:sw-offline-ready'));
  },

  onRegisterError(error) {
    if (import.meta.env.DEV) {
      console.error('[PWA] Service worker registration failed:', error);
    }
    Sentry.captureException(error, { tags: { type: 'sw-register-error' } });
  },
});

// Trigger an immediate check for updates on app load
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.update().catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[PWA] Service worker update check failed on app load:', err.message);
      }
    });
  });
}

initSyncManager();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <SocketProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </SocketProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);

// Performance monitoring (Web Vitals) sent to analytics backend
// Skip in E2E test runs — the /api/performance/vitals endpoint is not available
// in CI and the constant ECONNREFUSED proxy errors prevent networkidle from settling.
if (!navigator.userAgent.includes('Playwright')) {
  reportWebVitals((metric) => {
    const body = JSON.stringify(metric);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/performance/vitals', body);
    } else {
      fetch('/api/performance/vitals', { body, method: 'POST', keepalive: true });
    }
  });
}
