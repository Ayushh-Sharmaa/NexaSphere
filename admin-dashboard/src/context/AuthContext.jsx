import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/auth';

const AuthContext = createContext(null);

const LOGOUT_EVENT_KEY = 'logout-event';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(
    async (message = 'Your session has expired. Please log in again.') => {
      try {
        await auth.logout();
      } catch {
        // ignore
      }

      // Broadcast logout to other tabs
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());

      setIsAuthenticated(false);

      navigate('/login', {
        replace: true,
        state: { message },
      });
    },
    [navigate]
  );

  const login = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/dashboard', {
      replace: true,
    });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    auth.verifySession().then((valid) => {
      if (cancelled) return;
      setIsAuthenticated(valid);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === LOGOUT_EVENT_KEY) {
        setIsAuthenticated(false);

        navigate('/login', {
          replace: true,
          state: {
            message: 'You have been logged out from another tab.',
          },
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }

  return ctx;
}
