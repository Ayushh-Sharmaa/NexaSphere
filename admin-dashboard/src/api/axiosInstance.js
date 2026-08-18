// Thin fetch-based HTTP client with an axios-compatible interface.
// Reads VITE_API_BASE from the environment; defaults to an empty string
// (same-origin) when not set.
import { eventEmitter, EVENTS } from "../services/eventEmitter";

const BASE_URL = (import.meta.env?.VITE_API_BASE ?? "").replace(/\/$/, "");

function getAuthHeader() {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(
  method,
  url,
  { data, params, timeout = 30000, signal: callerSignal } = {}
) {
  let fullUrl = `${BASE_URL}${url}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) fullUrl += `?${qs}`;
  }

  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeout);

  // Link caller signal if provided
  if (callerSignal) {
    callerSignal.addEventListener("abort", () => timeoutController.abort());
  }

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    signal: timeoutController.signal,
  };

  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(fullUrl, options);

    if (response.status === 401) {
      eventEmitter.emit(EVENTS.AUTH_TOKEN_EXPIRED, {
        url,
        status: 401,
        message: "Admin session expired",
      });
    }

    if (!response.ok) {
      const error = new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );
      error.response = { status: response.status, data: null };
      try {
        error.response.data = await response.json();
      } catch {
        // non-JSON body — leave data as null
      }
      throw error;
    }

    const responseData = response.status === 204 ? null : await response.json();
    return { data: responseData, status: response.status };
  } finally {
    clearTimeout(timer);
  }
}

const axiosInstance = {
  get: (url, config) => request("GET", url, config),
  post: (url, data, config) => request("POST", url, { ...config, data }),
  put: (url, data, config) => request("PUT", url, { ...config, data }),
  patch: (url, data, config) => request("PATCH", url, { ...config, data }),
  delete: (url, config) => request("DELETE", url, config),
};

export default axiosInstance;
