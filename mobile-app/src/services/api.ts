import Constants from 'expo-constants';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

let baseHostUrl = 'http://127.0.0.1:8000';

// Automatically resolve localhost to host IP in Expo Go development
const hostUri = Constants.expoConfig?.hostUri;
if (hostUri) {
  const ip = hostUri.split(':')[0];
  baseHostUrl = `http://${ip}:8000`;
} else {
  baseHostUrl = 'http://10.0.2.2:8000'; // Android emulator fallback
}

export const authApi = axios.create({
  baseURL: `${baseHostUrl}/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const api = axios.create({
  baseURL: `${baseHostUrl}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to retrieve jwt_token from SecureStore:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track whether we're currently refreshing to avoid infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Auto-refresh expired tokens on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('jwt_refresh_token');
        if (!refreshToken) {
          // No refresh token, clear stale session and force redirect to login
          processQueue(error, null);
          await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
          await SecureStore.deleteItemAsync('jwt_refresh_token').catch(() => {});
          await SecureStore.deleteItemAsync('user_profile').catch(() => {});
          setTimeout(() => {
            router.replace('/login');
          }, 100);
          return Promise.reject(error);
        }

        const { data } = await authApi.post('/refresh/', { refresh: refreshToken });
        const newAccessToken = data.access;

        // Store the new tokens
        await SecureStore.setItemAsync('jwt_token', newAccessToken);
        if (data.refresh) {
          await SecureStore.setItemAsync('jwt_refresh_token', data.refresh);
        }

        // Retry failed request and process queued requests
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear stored tokens on refresh failure and force redirect to login
        await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
        await SecureStore.deleteItemAsync('jwt_refresh_token').catch(() => {});
        await SecureStore.deleteItemAsync('user_profile').catch(() => {});
        setTimeout(() => {
          router.replace('/login');
        }, 100);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
