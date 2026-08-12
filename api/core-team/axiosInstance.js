// axiosInstance.js
// A pre-configured Axios instance with a global 401 interceptor.
// Import and use this everywhere instead of the bare `axios` object.

import axios from 'axios';
import { getToken, removeToken, clearAutoLogoutTimer } from './authUtils';

// ─── 1. Create a shared instance ──────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
});

// ─── 2. Request interceptor — attach Bearer token automatically ───────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── 3. Response interceptor — handle 401 globally ───────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Initialise the 401 interceptor.
 * Call this once during app bootstrap, passing your router's `navigate` function.
/**
 * Initialise the 401 interceptor.
 * Call this once during app bootstrap, passing your router's `navigate` function.
 *
 * Example (React Router v6):
 *   import { useNavigate } from 'react-router-dom';
 *   const navigate = useNavigate();
 *   setupAxiosInterceptors(navigate);
 */
export function setupAxiosInterceptors(navigate) {
  axiosInstance.interceptors.response.use(
    (response) => response, // pass-through for successful responses

    (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise(function (resolve, reject) {
          // Attempt to refresh (assume /api/auth/refresh exists)
          axios
            .post(
              `${axiosInstance.defaults.baseURL || '/api'}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then(({ data }) => {
              // The backend usually sets an HttpOnly cookie or returns the access token
              const newAccessToken = data.accessToken || data.token;

              if (newAccessToken && typeof window !== 'undefined') {
                // Try to dynamically require authUtils if setToken exists
                try {
                  // Fallback logic
                  localStorage.setItem('accessToken', newAccessToken);
                } catch (e) {}
              }

              axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
              originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
              processQueue(null, newAccessToken);
              resolve(axiosInstance(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);

              // Stop the proactive timer — we're already logging out reactively.
              try {
                clearAutoLogoutTimer();
              } catch (e) {}
              // Clean up stored credentials.
              try {
                removeToken();
              } catch (e) {}

              // Redirect to login with a user-friendly message.
              navigate('/login', {
                replace: true,
                state: { message: 'Your session has expired. Please log in again.' },
              });
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
      if (error.response?.status === 401) {
        // Stop the proactive timer — we're already logging out reactively.
        clearAutoLogoutTimer();

        // Clean up stored credentials.
        removeToken();

        // Redirect to login with a user-friendly message.
        navigate('/login', {
          replace: true,
          state: { message: 'Your session has expired. Please log in again.' },
        });
      }

      return Promise.reject(error);
    }
  );
}

export default axiosInstance;
