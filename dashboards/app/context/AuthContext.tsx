"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  avatar_url?: string | null;
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
  const pathname = usePathname();

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

    // Set up auth:unauthorized event listener for clean SPA redirects
    const handleUnauthorized = () => {
      setUser(null);
      router.push("/login");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:unauthorized", handleUnauthorized);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:unauthorized", handleUnauthorized);
      }
    };
  }, [router]);

  useEffect(() => {
    if (isLoading) return;
    const isOwnerRoute = pathname.startsWith("/owner");
    const isSupervisorRoute = pathname.startsWith("/supervisor");
    const isSalesRoute = pathname.startsWith("/sales");
    const isTelecallerRoute = pathname.startsWith("/telecaller");
    const isStaffRoute = pathname.startsWith("/staff");

    if (isOwnerRoute || isSupervisorRoute || isSalesRoute || isTelecallerRoute || isStaffRoute) {
      if (!user) {
        router.push("/login");
        return;
      }
      const role = user.role;
      if (isOwnerRoute && role !== "owner" && role !== "admin") {
        router.push("/login");
      } else if (isSupervisorRoute && role !== "supervisor") {
        router.push("/login");
      } else if (isSalesRoute && role !== "sales_executive" && role !== "sales") {
        router.push("/login");
      } else if (isTelecallerRoute && role !== "telecaller") {
        router.push("/login");
      } else if (isStaffRoute && role !== "staff") {
        router.push("/login");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string): Promise<UserProfile> => {
    try {
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      if (typeof window !== "undefined") {
        if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          apiBaseUrl = `${window.location.origin}/api/v1`;
        }
      }
      const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");
      const authUrl = `${apiOrigin}/api/auth/login/`;

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

      // Verify cookies are written (avoid race condition on fast redirects)
      let retries = 0;
      while (retries < 5 && getCookie("jwt_token") !== access) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        retries++;
      }

      setUser(userProfile);
      
      // Redirect based on role path mapping
      const roleRedirectMap = {
        admin: "/owner",
        owner: "/owner",
        supervisor: "/supervisor",
        sales_executive: "/sales",
        sales: "/sales",
        telecaller: "/telecaller",
        staff: "/staff",
      };

      const redirectPath = roleRedirectMap[userProfile.role as keyof typeof roleRedirectMap] || "/";
      router.push(redirectPath);

      return userProfile;
    } catch (error: any) {
      console.error("Authentication request failed:", error);
      if (error.response && error.response.data) {
        let detail = error.response.data.detail || error.response.data.non_field_errors?.[0];
        if (!detail || typeof detail !== "string") {
          detail = "Invalid credentials. Please check your username and password.";
        }
        if (detail.toLowerCase().includes("no active account") || detail.toLowerCase().includes("invalid credentials")) {
          detail = "Invalid credentials. Please check your username and password.";
        }
        throw new Error(detail);
      }
      if (error.message === "Network Error" || !error.response) {
        throw new Error("Network error connecting to authentication server. Please check your internet connection.");
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
