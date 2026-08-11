/**
 * InstallPrompt — NexaSphere PWA
 * ================================
 * Shows an elegant "Add to Home Screen" card after:
 *  - 30 seconds of use, OR
 *  - The 3rd app open
 * Dismissed state is persisted to localStorage.
 */

import { useState, useEffect, useRef } from 'react';
import { PREF_KEYS } from '../../utils/indexedDB.js';
import '../../styles/pwa.css';

const SHOW_DELAY_MS = 30 * 1000; // 30 seconds
const OPEN_COUNT_KEY = PREF_KEYS.INSTALL_COUNT;
const DISMISSED_KEY = PREF_KEYS.INSTALL_DISMISSED;
const SHOW_AFTER_OPENS = 3;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Wrap all localStorage access in try-catch — throws SecurityError in
    // Safari private browsing or QuotaExceededError when storage is full.
    let openCount = 1;
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') return;
      openCount = parseInt(localStorage.getItem(OPEN_COUNT_KEY) || '0', 10) + 1;
      localStorage.setItem(OPEN_COUNT_KEY, String(openCount));
    } catch {
      // Storage unavailable — proceed without persisting state.
      // Default openCount of 1 means the prompt will show after the delay.
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Don't show native prompt immediately
      setDeferredPrompt(e);

      const shouldShowNow = openCount >= SHOW_AFTER_OPENS;

      if (shouldShowNow) {
        // Show immediately after open count threshold
        setTimeout(() => setVisible(true), 1500);
      } else {
        // Show after delay
        timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful install
    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        try {
          localStorage.setItem(DISMISSED_KEY, 'true');
        } catch {
          // Storage unavailable — dismissed state will not persist.
        }
      }
    } catch (err) {
      console.warn('[InstallPrompt] Install failed:', err);
    } finally {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Storage unavailable — dismissed state will not persist.
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Don't render if no prompt event (browser doesn't support or already installed)
  if (!deferredPrompt && !visible) return null;

  return (
    <div
      className={`pwa-install-prompt${visible ? ' pwa-install--visible' : ''}`}
      role="dialog"
      aria-label="Install NexaSphere app"
      aria-modal="false"
    >
      <div className="pwa-install__header">
        <div className="pwa-install__icon" aria-hidden="true">
          🌐
        </div>
        <div>
          <div className="pwa-install__title">Install NexaSphere</div>
          <div className="pwa-install__sub">Add to your home screen</div>
        </div>
      </div>

      <div className="pwa-install__features">
        <div className="pwa-install__feature">
          <span className="pwa-install__feature-icon">⚡</span>
          Instant load — works offline
        </div>
        <div className="pwa-install__feature">
          <span className="pwa-install__feature-icon">🔔</span>
          Push notifications for events
        </div>
        <div className="pwa-install__feature">
          <span className="pwa-install__feature-icon">📱</span>
          Native app-like experience
        </div>
      </div>

      <div className="pwa-install__actions">
        <button
          id="pwa-install-btn"
          className="pwa-btn-install"
          onClick={handleInstall}
          aria-label="Install NexaSphere to home screen"
        >
          Add to Home Screen
        </button>
        <button
          id="pwa-dismiss-btn"
          className="pwa-btn-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
