function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function isLocalHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getBrowserHostname() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
}

function getLocalDefaultUrl(port) {
  return isLocalHostname(getBrowserHostname()) ? `http://localhost:${port}` : '';
}

export function getApiBase() {
  const browserHost = getBrowserHostname();
  const isLocal = !browserHost || isLocalHostname(browserHost);
  return (
    normalizeUrl(import.meta.env.VITE_API_BASE) ||
    (isLocal ? '/api' : 'https://nexasphere-api.onrender.com')
  );
}

export function getAiApiBase() {
  return normalizeUrl(import.meta.env.VITE_AI_API_BASE) || getLocalDefaultUrl(8000) || getApiBase();
}

export function getSocketServerUrl() {
  return normalizeUrl(import.meta.env.VITE_SOCKET_URL) || getApiBase() || getLocalDefaultUrl(8787);
}

export function getSocketPath() {
  return import.meta.env.VITE_SOCKET_PATH || '/socket.io';
}

export function hasSocketServer() {
  return Boolean(getSocketServerUrl());
}

export function buildUrl(base, path) {
  const normalizedBase = normalizeUrl(base);
  if (!normalizedBase) return '';
  if (!path) return normalizedBase;
  return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
}
