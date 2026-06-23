import Constants from 'expo-constants';
import { create } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';

export let baseHostUrl = 'https://kvr.thehps.in';

// Helper to race promises safely in React Native
const safePromiseAny = async <T>(promises: Promise<T>[]): Promise<T> => {
  if (typeof Promise.any === 'function') {
    return Promise.any(promises);
  }
  return new Promise<T>((resolve, reject) => {
    let rejectedCount = 0;
    if (promises.length === 0) {
      reject(new Error('No promises to race'));
      return;
    }
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All promises failed'));
        }
      });
    });
  });
};

const pingUrl = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(id);
    return url;
  } catch (err) {
    throw err;
  } finally {
    clearTimeout(id);
  }
};

let resolvedBaseUrl: string | null = null;
let resolvePromise: Promise<string> | null = null;

export const getBaseHostUrl = async (): Promise<string> => {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  // Check if explicit env variable is set
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    resolvedBaseUrl = envUrl;
    baseHostUrl = envUrl;
    authApi.defaults.baseURL = `${envUrl}/api/auth`;
    api.defaults.baseURL = `${envUrl}/api/v1`;
    return resolvedBaseUrl;
  }

  if (!__DEV__) {
    resolvedBaseUrl = 'https://kvr.thehps.in';
    return resolvedBaseUrl;
  }
  if (resolvePromise) return resolvePromise;

  const candidates: string[] = [];
  
  // Prioritize Expo packager host IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      candidates.push(`http://${ip}:8000`);
    }
  }

  // Fallback to platform-specific emulator loopback address
  if (Platform.OS === 'android') {
    if (!candidates.includes('http://10.0.2.2:8000')) {
      candidates.push('http://10.0.2.2:8000');
    }
  } else {
    if (!candidates.includes('http://127.0.0.1:8000')) {
      candidates.push('http://127.0.0.1:8000');
    }
  }

  resolvePromise = (async () => {
    try {
      const wonUrl = await safePromiseAny(candidates.map((url) => pingUrl(url)));
      resolvedBaseUrl = wonUrl;
      baseHostUrl = wonUrl;
      authApi.defaults.baseURL = `${wonUrl}/api/auth`;
      api.defaults.baseURL = `${wonUrl}/api/v1`;
      return wonUrl;
    } catch {
      resolvedBaseUrl = candidates[0] || 'http://127.0.0.1:8000';
      baseHostUrl = resolvedBaseUrl;
      return resolvedBaseUrl;
    }
  })();

  return resolvePromise;
};

export const authApi = create({
  baseURL: `${baseHostUrl}/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach dynamic host resolver to auth requests
authApi.interceptors.request.use(
  async (config) => {
    const currentBaseUrl = await getBaseHostUrl();
    config.baseURL = `${currentBaseUrl}/api/auth`;
    return config;
  },
  (error) => Promise.reject(error)
);

const api = create({
  baseURL: `${baseHostUrl}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use(
  async (config) => {
    const currentBaseUrl = await getBaseHostUrl();
    config.baseURL = `${currentBaseUrl}/api/v1`;
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
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

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
