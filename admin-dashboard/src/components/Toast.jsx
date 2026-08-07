import { useState, useCallback } from "react";
import { useEventListener } from "../hooks/useEventListener";
import { EVENTS } from "../services/eventEmitter";

const MAX_TOASTS = 3;

function createToastId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Toast() {
  const [toasts, setToasts] = useState([]);

  const handleNotify = useCallback(({ type, message }) => {
    const id = createToastId();
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      return next.length > MAX_TOASTS
        ? next.slice(next.length - MAX_TOASTS)
        : next;
    });
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEventListener(EVENTS.NOTIFY, handleNotify);

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="toast-close"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
