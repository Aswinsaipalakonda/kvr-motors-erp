import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { authApi } from '../services/api';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'owner' | 'supervisor' | 'sales' | string;
  branch: number | null;
  branch_name?: string;
  showroom: number | null;
  phone_number: string;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to register push token with Django backend
  const registerPushNotificationsLater = async () => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await api.patch('/auth/me/', { expo_push_token: pushToken });
        console.log('Successfully registered Expo push token with backend:', pushToken);
      }
    } catch (err) {
      console.warn('Failed to register push token with backend:', err);
    }
  };

  // Load session from SecureStore on launch
  useEffect(() => {
    async function loadSession() {
      try {
        const storedToken = await SecureStore.getItemAsync('jwt_token');
        const storedRefreshToken = await SecureStore.getItemAsync('jwt_refresh_token');
        const storedUser = await SecureStore.getItemAsync('user_profile');
        
        if (storedToken && storedRefreshToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Register token asynchronously
          setTimeout(registerPushNotificationsLater, 500);
        } else if (storedToken || storedUser) {
          // Stale/legacy session detected without a refresh token. Purge it to prevent 401 loops!
          await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
          await SecureStore.deleteItemAsync('jwt_refresh_token').catch(() => {});
          await SecureStore.deleteItemAsync('user_profile').catch(() => {});
        }
      } catch (e) {
        console.error('Failed to load session from SecureStore:', e);
        // Clear corrupted data
        await SecureStore.deleteItemAsync('jwt_token').catch(() => {});
        await SecureStore.deleteItemAsync('jwt_refresh_token').catch(() => {});
        await SecureStore.deleteItemAsync('user_profile').catch(() => {});
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.post('/login/', { username, password });
      const { access, refresh, user: userProfile } = response.data;

      if (!access || !userProfile) {
        throw new Error('Invalid response format from authentication server.');
      }

      // Save both tokens and profile to SecureStore
      await SecureStore.setItemAsync('jwt_token', access);
      if (refresh) {
        await SecureStore.setItemAsync('jwt_refresh_token', refresh);
      }
      await SecureStore.setItemAsync('user_profile', JSON.stringify(userProfile));

      setToken(access);
      setUser(userProfile);
      
      // Register token asynchronously
      setTimeout(registerPushNotificationsLater, 500);
    } catch (err: any) {
      console.error('Login failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync('jwt_token');
      await SecureStore.deleteItemAsync('jwt_refresh_token');
      await SecureStore.deleteItemAsync('user_profile');
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedUser: UserProfile) => {
    try {
      await SecureStore.setItemAsync('user_profile', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to save updated user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
