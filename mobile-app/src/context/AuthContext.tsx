import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { authApi } from '../services/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'owner' | 'supervisor' | 'sales' | string;
  branch: number | null;
  showroom: number | null;
  phone_number: string;
  is_active: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
