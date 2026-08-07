import { useCallback, useEffect, useRef } from "react";
import { EVENTS } from "../services/eventEmitter";
import { useEventListener } from "./useEventListener";

export function useLogoutAwareInterval(callback, delay, enabled = true) {
  const intervalRef = useRef(null);

  const clearPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEventListener(EVENTS.AUTH_LOGOUT, clearPolling);
  useEventListener(EVENTS.AUTH_TOKEN_EXPIRED, clearPolling);

  useEffect(() => {
    clearPolling();

    if (!enabled) {
      return undefined;
    }

    intervalRef.current = setInterval(callback, delay);

    return clearPolling;
  }, [callback, delay, enabled, clearPolling]);

  return clearPolling;
}
