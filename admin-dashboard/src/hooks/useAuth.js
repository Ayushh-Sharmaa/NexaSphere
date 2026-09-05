import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { auth } from '../services/auth';
import { useEventListener } from './useEventListener';
import { EVENTS } from '../services/eventEmitter';

export function useAuth() {
  const navigate = useNavigate();

  const handleExpiry = useCallback(() => {
    auth.logout();
    navigate('/login');
  }, [navigate]);

  useEventListener(EVENTS.AUTH_TOKEN_EXPIRED, handleExpiry);

  return {
    isAuthenticated: auth.isAuthenticated(),
    email: auth.getEmail(),
    logout: () => { auth.logout(); navigate('/login'); },
  };
}
