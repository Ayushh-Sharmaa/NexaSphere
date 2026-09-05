import { useEffect } from 'react';
import { eventEmitter } from '../services/eventEmitter';

export function useEventListener(event, handler) {
  useEffect(() => {
    eventEmitter.on(event, handler);
    return () => eventEmitter.off(event, handler);
  }, [event, handler]);
}
