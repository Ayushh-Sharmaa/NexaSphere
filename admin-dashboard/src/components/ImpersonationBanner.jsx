import { useState, useEffect } from "react";
import { api } from "../services/api";
import { eventEmitter, EVENTS } from "../services/eventEmitter";
import { useEventListener } from "../hooks/useEventListener";

export function ImpersonationBanner() {
  const [impersonating, setImpersonating] = useState(null);

  useEffect(() => {
    api.impersonate
      .status()
      .then((r) => {
        setImpersonating(r.impersonating ? r.user : null);
      })
      .catch(() => {});
  }, []);

  useEventListener(EVENTS.IMPERSONATION_STARTED, (e) =>
    setImpersonating(e.user)
  );
  useEventListener(EVENTS.IMPERSONATION_STOPPED, () => setImpersonating(null));

  if (!impersonating) return null;

  const stop = async () => {
    await api.impersonate.stop();
    setImpersonating(null);
    eventEmitter.emit(EVENTS.IMPERSONATION_STOPPED);
  };

  return (
    <div className="impersonation-banner">
      <span>
        You are viewing as{" "}
        <strong>{impersonating.display_name || impersonating.username}</strong>
      </span>
      <button className="btn btn-sm btn-outline" onClick={stop}>
        Stop Impersonating
      </button>
    </div>
  );
}
