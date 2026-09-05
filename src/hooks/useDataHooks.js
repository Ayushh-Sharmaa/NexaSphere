import { useState, useEffect, useCallback } from 'react';
import { API_BASE, THEME_STORAGE_KEY, DEFAULT_THEME, EVENTS_API_ENDPOINT } from '../data/config';

export function useThemeManagement() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}

export function useDynamicEvents(fallbackEvents) {
  const [eventsData, setEventsData] = useState(fallbackEvents);

  useEffect(() => {
    let isMounted = true;
    const url = API_BASE ? `${API_BASE}${EVENTS_API_ENDPOINT}` : EVENTS_API_ENDPOINT;

    fetch(url)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('Failed to load events'))))
      .then(data => {
        if (isMounted && Array.isArray(data?.events) && data.events.length > 0) {
          setEventsData(data.events);
        }
      })
      .catch(() => {
        // Silent fail
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return eventsData;
}
