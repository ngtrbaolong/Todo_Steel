// src/lib/api.js
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true,
});

// request interceptor: attach latest access token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// refresh control
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// response interceptor: handle 401/403 with single refresh flow
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) return Promise.reject(error);

    // skip specific endpoints to avoid infinite loops
    const skipUrls = ["/auth/signin", "/auth/signup", "/auth/refresh"];
    if (skipUrls.some((u) => originalRequest.url?.includes(u))) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // consider 401 and 403 as token-expired / unauthorized cases
    if ((status === 401 || status === 403)) {
      // if request already retried, reject
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      // If currently refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              // attach new token and retry
              originalRequest.headers = originalRequest.headers || {};
              if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
              originalRequest._retry = true;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      // start refresh flow
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // call refresh endpoint directly using api (it will skip here because of skipUrls)
        const refreshRes = await api.post("/auth/refresh", null, { withCredentials: true });
        const newAccessToken = refreshRes.data?.accessToken;

        if (!newAccessToken) {
          // refresh did not return token -> force logout
          useAuthStore.getState().clearState();
          processQueue(new Error("No access token after refresh"), null);
          return Promise.reject(error);
        }

        // save new token into store
        useAuthStore.getState().setAccessToken(newAccessToken);

        // process queued requests
        processQueue(null, newAccessToken);

        // retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // refresh failed -> clear auth and reject all queued requests
        useAuthStore.getState().clearState();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // not a token issue -> reject normally
    return Promise.reject(error);
  }
);

export default api;
