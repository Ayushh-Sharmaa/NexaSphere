import { useState, useEffect } from "react";
import { auth } from "../services/auth";

export function OfflineBanner() {
  const isEnvOffline =
    auth && typeof auth.isOfflineMode === "function" && auth.isOfflineMode();
  const [isNetworkOffline, setIsNetworkOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsNetworkOffline(true);
    const handleOnline = () => setIsNetworkOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const isOffline = isEnvOffline || isNetworkOffline;

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="assertive">
      <span className="offline-icon" aria-hidden="true">
        &#9888;
      </span>
      <span>
        {isEnvOffline ? (
          <>
            <strong>Offline Mode</strong> — Changes are saved locally and will
            not sync to the server.
          </>
        ) : (
          <>
            <strong>No Connection</strong> — Changes cannot be saved until
            connectivity is restored.
          </>
        )}
      </span>
    </div>
  );
}
