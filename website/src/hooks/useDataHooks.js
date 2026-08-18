import { useState, useEffect, useCallback } from 'react';
import { THEME_STORAGE_KEY, DEFAULT_THEME, EVENTS_API_ENDPOINT } from '../data/config';
import { getApiBase } from '../utils/runtimeConfig';

export function useThemeManagement() {
  const [theme, setTheme] = useState(() => {
    // Wrapped in try-catch — localStorage.getItem throws SecurityError
    // in Safari private browsing mode.
    try {
      return (
        document.documentElement.getAttribute('data-theme') ||
        localStorage.getItem(THEME_STORAGE_KEY) ||
        DEFAULT_THEME
      );
    } catch {
      return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    // Wrapped in try-catch — localStorage.setItem throws SecurityError
    // in Safari private browsing or QuotaExceededError when storage is full.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable — theme applies for the session only.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}

export function useDynamicEvents(fallbackEvents) {
  const [eventsData, setEventsData] = useState(fallbackEvents);

  useEffect(() => {
    let isMounted = true;
    const base = getApiBase();
    const url = base ? `${base}${EVENTS_API_ENDPOINT}` : EVENTS_API_ENDPOINT;

    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load events'))))
      .then((data) => {
        if (isMounted && Array.isArray(data?.events)) {
          setEventsData(data.events);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[useDataHooks] Failed to fetch events:', err.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return eventsData;
}
