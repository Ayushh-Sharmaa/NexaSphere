import { useCallback } from 'react';
import { eventEmitter, EVENTS } from '../services/eventEmitter';

export function useToast() {
  const showToast = useCallback((message, type = 'info') => {
    eventEmitter.emit(EVENTS.NOTIFY, { type, message });
  }, []);

  return { showToast };
}
