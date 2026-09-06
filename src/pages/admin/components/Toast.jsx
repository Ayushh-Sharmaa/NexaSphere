import { useState, useCallback } from 'react';
import { useEventListener } from '../hooks/useEventListener';
import { EVENTS } from '../services/eventEmitter';

export function Toast() {
  const [toasts, setToasts] = useState([]);

  const handleNotify = useCallback(({ type, message }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEventListener(EVENTS.NOTIFY, handleNotify);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}
