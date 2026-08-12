import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import { initializeSentry } from './utils/errorTracking.js';
import * as Sentry from '@sentry/react';
import { AppProviders } from './context/AppProviders';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/theme/ThemeProvider';
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx';
import { PrefetchProvider } from './components/PrefetchProvider.jsx';
import { BrowserRouter } from 'react-router-dom';

initializeSentry();

window.addEventListener('unhandledrejection', (event) => {
  Sentry.captureException(event.reason, {
    tags: { type: 'unhandledrejection' },
  });
});

window.addEventListener('error', (event) => {
  Sentry.captureException(event.error, { tags: { type: 'uncaughterror' } });
});

// Apply saved theme before React renders
const savedTheme = localStorage.getItem('nexasphere-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Register service worker
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <PrefetchProvider>
            <App />
          </PrefetchProvider>
        </ThemeProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
