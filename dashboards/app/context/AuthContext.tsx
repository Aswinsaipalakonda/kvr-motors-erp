"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setCookie, getCookie, eraseCookie } from "../utils/cookies";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "owner" | "supervisor" | "sales_executive" | "sales" | "telecaller" | "staff";
  branch: string | null;
  showroom: string | null;
  phone_number: string | null;
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
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  updateUser: (updatedUser: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if session token and user details exist in cookies
    const storedUser = getCookie("user_profile");
    const token = getCookie("jwt_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user profile cookie:", e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<UserProfile> => {
    try {
      const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
      const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.");
      const authUrl = isLocal ? `http://${host}:8000/api/auth/login/` : "https://kvr.thehps.in/api/auth/login/";

      const response = await axios.post(authUrl, {
        username,
        password,
      });

      const { access, user: userProfile } = response.data;

      if (!access || !userProfile) {
        throw new Error("Invalid response format from authentication server.");
      }

      // Save credentials inside browser cookies
      // jwt_token expires in 1 day, user_role & user_profile synchronized
      setCookie("jwt_token", access, 1);
      setCookie("user_role", userProfile.role, 1);
      setCookie("user_profile", JSON.stringify(userProfile), 1);

      setUser(userProfile);
      
      // Redirect based on role path mapping
      const roleRedirectMap = {
        admin: "/owner",
        owner: "/owner",
        supervisor: "/supervisor",
        sales_executive: "/sales",
        sales: "/sales",
        telecaller: "/telecaller",
      };

      const redirectPath = roleRedirectMap[userProfile.role as keyof typeof roleRedirectMap] || "/";
      router.push(redirectPath);

      return userProfile;
    } catch (error: any) {
      console.error("Authentication request failed:", error);
      if (error.response && error.response.data) {
        // DRF simple_jwt standard errors
        const detail = error.response.data.detail || "Invalid credentials. Please verify your entries.";
        throw new Error(detail);
      }
      throw new Error(error.message || "Failed to connect to authentication server.");
    }
  };

  const logout = () => {
    eraseCookie("jwt_token");
    eraseCookie("user_role");
    eraseCookie("user_profile");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updatedUser: UserProfile) => {
    setCookie("user_profile", JSON.stringify(updatedUser), 1);
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
