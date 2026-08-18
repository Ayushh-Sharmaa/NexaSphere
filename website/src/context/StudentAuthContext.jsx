import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';
import { useTheme } from '../hooks/useTheme';

export const StudentAuthContext = createContext(null);

const TOKEN_KEY = 'ns_student_token';

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the current user using cookie-based session (httpOnly cookie).
  const fetchMe = useCallback(async () => {
    try {
      const data = await apiClient('/api/auth/me', { credentials: 'include' });
      setUser(data.user || null);
      if (data.user) {
        localStorage.setItem(
          'ns_user',
          JSON.stringify({
            id: data.user.sub || data.user.id,
            email: data.user.email,
            name: data.user.name,
          })
        );
      } else {
        localStorage.removeItem('ns_user');
      }
    } catch {
      localStorage.removeItem('ns_user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // If OAuth redirected with a token query param, remove it from the URL
    // to avoid accidental leakage, but don't store the token client-side.
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      params.delete('token');
      const cleanUrl =
        window.location.pathname +
        (params.toString() ? '?' + params.toString() : '') +
        window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      fetchMe().finally(() => setLoading(false));
      return;
    }

    // Normal startup: attempt to fetch current user via cookie-based session.
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('ns_user');
      setUser(null);
      alert('Your session has expired. Please log in again.');
      window.location.href = '/login';
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const login = useCallback((provider) => {
    window.location.href = `/api/auth/${provider}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    localStorage.removeItem('ns_user');
    setUser(null);
  }, []);

  const { setTheme } = useTheme();

  useEffect(() => {
    if (user && user.theme) {
      setTheme(user.theme);
    }
  }, [user, setTheme]);

  const value = { user, loading, login, logout, isAuthenticated: !!user };

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

const defaultAuthState = {
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
};

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) return defaultAuthState;
  return ctx;
}
