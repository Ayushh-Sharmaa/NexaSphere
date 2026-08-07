/**
 * Hook for Socket.IO analytics integration
 * Manages real-time connection and data updates.
 * Uses the shared admin socket client for connection management.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSocket,
  on,
  off,
  emit,
  isConnected as checkConnected,
} from "../services/socketClient";

/**
 * Hook to manage analytics WebSocket connection
 */
export function useAnalyticsSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize the shared admin socket if not already connected
    if (!socketRef.current || !checkConnected()) {
      socketRef.current = getSocket();
    }

    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    on("connect", handleConnect);
    on("disconnect", handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
    };
  }, [eventId]);

  return { analytics, connected };
}

/**
 * Hook to subscribe to event analytics
 */
export function useEventAnalytics(eventId) {
  const socket = useAnalyticsSocket();
  const [metrics, setMetrics] = useState(null);
  const [registrationTrends, setRegistrationTrends] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [checkInStats, setCheckInStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to event analytics
  useEffect(() => {
    if (!socket || !eventId) return;

    setLoading(true);

    // Subscribe to the event
    emit("analytics:subscribe", eventId);

    // Request current data
    emit("analytics:request:metrics", eventId);
    emit("analytics:request:trends", { eventId, timeWindow: "7 days" });

    // Listen for updates
    const handleMetricsUpdate = (data) => {
      if (data.eventId === eventId) {
        setMetrics(data.metrics);
        setLoading(false);
      }
    };

    const handleMetricsCurrent = (data) => {
      if (data.eventId === eventId) {
        setMetrics(data.metrics);
        setLoading(false);
      }
    };

    const handleTrendsCurrent = (data) => {
      if (data.eventId === eventId) {
        setRegistrationTrends(data.trends || []);
      }
    };

    const handleRecentRegistration = (data) => {
      if (data.eventId === eventId) {
        setRecentRegistrations((prev) =>
          [data.registration, ...prev].slice(0, 20)
        );
      }
    };

    const handleCheckIn = (data) => {
      if (data.eventId === eventId) {
        // Update metrics to reflect check-in
        emit("analytics:request:metrics", eventId);
      }
    };

    const handleError = (data) => {
      if (data.eventId === eventId) {
        setError(data.error);
        setLoading(false);
      }
    };

    on("analytics:metrics:update", handleMetricsUpdate);
    on("analytics:metrics:current", handleMetricsCurrent);
    on("analytics:trends:current", handleTrendsCurrent);
    on("analytics:registration:new", handleRecentRegistration);
    on("analytics:checkin:new", handleCheckIn);
    on("analytics:error", handleError);

    return () => {
      off("analytics:metrics:update", handleMetricsUpdate);
      off("analytics:metrics:current", handleMetricsCurrent);
      off("analytics:trends:current", handleTrendsCurrent);
      off("analytics:registration:new", handleRecentRegistration);
      off("analytics:checkin:new", handleCheckIn);
      off("analytics:error", handleError);
      emit("analytics:unsubscribe", eventId);
    };
  }, [socket, eventId]);

  return {
    metrics,
    registrationTrends,
    recentRegistrations,
    checkInStats,
    loading,
    error,
    isConnected: socket?.connected || false,
  };
}

/**
 * Hook to emit events via socket
 */
export function useSocketEmit(socket) {
  return useCallback(
    (event, data, callback) => {
      if (!socket) return;
      socket.emit(event, data, callback);
    },
    [socket]
  );
}

export default useAnalyticsSocket;
