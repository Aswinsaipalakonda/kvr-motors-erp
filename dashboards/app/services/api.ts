import axios from "axios";
import { getCookie, eraseCookie } from "../utils/cookies";

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")) {
      return `http://${host}:8000/api/v1`;
    }
    return "https://kvr.thehps.in/api/v1";
  }
  return "http://127.0.0.1:8000/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

// 401 Response Interceptor — auto-redirect to login on expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid — clear stale credentials and redirect
      eraseCookie("jwt_token");
      eraseCookie("user_role");
      eraseCookie("user_profile");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
