import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx';
import { ThemeProvider } from './context/theme/ThemeProvider.tsx';
import { registerSW } from 'virtual:pwa-register';
import { HelmetProvider } from 'react-helmet-async';

// Register service worker
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <GlobalErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </GlobalErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
