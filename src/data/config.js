export const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

export const THEME_STORAGE_KEY = 'ns-theme';
export const DEFAULT_THEME = 'dark';

export const EVENTS_API_ENDPOINT = '/api/content/events';

export const NAV_HEIGHTS = {
  DESKTOP: 60,
  MOBILE: 56
};

export const SCROLL_TIMEOUT = 50;

export const NAV_TABS = ['Home', 'Activities', 'Events', 'About', 'Team', 'Contact'];

export const MOBILE_BREAKPOINT = 768;

export const SCROLL_THRESHOLD = 20;
