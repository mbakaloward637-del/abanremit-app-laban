import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { api } from "@/services/api";
import type { AppUser } from "@/services/api";

export type UserRole = "user" | "admin" | "superadmin";

export type { AppUser };

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, metadata: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(() => {
    // Initialize from cached user data for instant render
    const cached = localStorage.getItem("cached_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached data, don't show loading
    return !localStorage.getItem("cached_user") && api.isAuthenticated();
  });
  const initialized = useRef(false);

  const fetchUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      localStorage.removeItem("cached_user");
      return;
    }
    try {
      const userData = await api.auth.me();
      setUser(userData);
      // Cache for instant render on next load
      localStorage.setItem("cached_user", JSON.stringify(userData));
    } catch {
      setUser(null);
      localStorage.removeItem("cached_user");
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Listen for 401 logouts
    api.onAuthStateChange((u) => {
      if (!u) {
        setUser(null);
        localStorage.removeItem("cached_user");
      }
    });
    
    // Only fetch if we need to verify token
    if (api.isAuthenticated()) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  // Poll for balance updates every 30s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await api.auth.me();
        setUser(fresh);
        localStorage.setItem("cached_user", JSON.stringify(fresh));
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      localStorage.setItem("cached_user", JSON.stringify(res.user));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    metadata: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.register({
        email,
        password,
        first_name: metadata.first_name || "",
        last_name: metadata.last_name || "",
        middle_name: metadata.middle_name,
        phone: metadata.phone,
        country: metadata.country,
        country_code: metadata.country_code,
        currency: metadata.currency,
        city: metadata.city,
        address: metadata.address,
        gender: metadata.gender,
        date_of_birth: metadata.date_of_birth,
        pin: metadata.pin,
      });
      setUser(res.user);
      localStorage.setItem("cached_user", JSON.stringify(res.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    localStorage.removeItem("cached_user");
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
      localStorage.setItem("cached_user", JSON.stringify(userData));
    } catch {}
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, isAdmin, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
