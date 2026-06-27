import axios from "axios";
import { getCookie, eraseCookie } from "../utils/cookies";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    API_BASE_URL = `${window.location.origin}/api/v1`;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  },
});

// Register client-only interceptors safely
if (typeof window !== "undefined") {
  // Automatic JWT Token Injection Interceptor
  api.interceptors.request.use(
    (config) => {
      const token = getCookie("jwt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 401 Response Interceptor — clear credentials and notify application context for SPA redirect
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token expired or invalid — clear stale credentials and dispatch unauthorized event
        eraseCookie("jwt_token");
        eraseCookie("user_role");
        eraseCookie("user_profile");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      return Promise.reject(error);
    }
  );
}

export default api;
