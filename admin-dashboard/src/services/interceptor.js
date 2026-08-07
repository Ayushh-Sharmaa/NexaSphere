import { eventEmitter, EVENTS } from "./eventEmitter";

export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  let isLoggingOut = false;

  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    try {
      const response = await originalFetch.apply(this, args);

      if (response.status === 401) {
        // Exclude endpoints that handle 401 themselves
        if (
          !url.includes("/api/admin/me") &&
          !url.includes("/api/admin/refresh") &&
          !url.includes("/api/admin/login")
        ) {
          if (!isLoggingOut) {
            isLoggingOut = true;
            eventEmitter.emit(EVENTS.AUTH_TOKEN_EXPIRED);
            setTimeout(() => {
              isLoggingOut = false;
            }, 3000);
          }
        }
      }
      return response;
    } catch (error) {
      throw error;
    }
  };
}
