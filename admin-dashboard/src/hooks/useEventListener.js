import { useEffect } from "react";
import { eventEmitter } from "../services/eventEmitter";

export function useEventListener(event, handler) {
  useEffect(() => {
    if (!eventEmitter || typeof eventEmitter.on !== "function") return;
    if (typeof handler !== "function") return;

    eventEmitter.on(event, handler);
    return () => {
      if (eventEmitter && typeof eventEmitter.off === "function") {
        eventEmitter.off(event, handler);
      }
    };
  }, [event, handler]);
}
