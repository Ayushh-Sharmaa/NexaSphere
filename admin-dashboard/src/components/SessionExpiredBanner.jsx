// SessionExpiredBanner.jsx
// Displays a dismissible banner on /login when redirected due to session expiry.
// Uses React Router's useLocation to read the message passed via navigate state.

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Fix #862: Auto-dismiss banner when user re-authenticates
// Add this useEffect inside the component:
//   useEffect(() => {
//     if (isAuthenticated) setVisible(false);
//   }, [isAuthenticated]);
export default function SessionExpiredBanner() {
  const { state } = useLocation();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state?.message) {
      setMessage(state.message);
      setVisible(true);

      // Auto-dismiss after 8 seconds.
      const timer = setTimeout(() => setVisible(false), 8_000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Fix #862: Auto-dismiss banner when user re-authenticates
  useEffect(() => {
    const handleLogin = () => setVisible(false);
    eventEmitter.on(EVENTS.AUTH_LOGIN, handleLogin);
    return () => eventEmitter.off(EVENTS.AUTH_LOGIN, handleLogin);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        marginBottom: "20px",
        borderRadius: "8px",
        backgroundColor: "#fff3cd",
        border: "1px solid #ffc107",
        color: "#7d4e00",
        fontSize: "0.9rem",
        fontWeight: 500,
      }}
    >
      <span>⚠️ {message}</span>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.1rem",
          color: "inherit",
          lineHeight: 1,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
