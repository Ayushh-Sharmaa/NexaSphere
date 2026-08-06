// Thin fetch-based HTTP client with an axios-compatible interface.
// Reads VITE_API_BASE from the environment; defaults to an empty string
// (same-origin) when not set.

import { TOKEN_KEY } from "../constants/authConstants";

const BASE_URL = (import.meta.env?.VITE_API_BASE ?? "").replace(/\/$/, "");

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, url, { data, params } = {}) {
  let fullUrl = `${BASE_URL}${url}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) fullUrl += `?${qs}`;
  }

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  };

  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, options);

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
}

const axiosInstance = {
  get: (url, config) => request("GET", url, config),
  post: (url, data, config) => request("POST", url, { ...config, data }),
  put: (url, data, config) => request("PUT", url, { ...config, data }),
  patch: (url, data, config) => request("PATCH", url, { ...config, data }),
  delete: (url, config) => request("DELETE", url, config),
};

export default axiosInstance;
