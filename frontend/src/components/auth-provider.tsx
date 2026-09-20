"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, cacheCredits, clearSession, getToken, setSession } from "@/lib/api";
import { recoverGoogleAuthUi } from "@/lib/google-auth";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  onboarding_completed: boolean;
  avatar_url?: string | null;
  credits?: number;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (full_name: string, email: string, password: string) => Promise<User>;
  completeSession: (access: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
      if (typeof me.credits === "number") cacheCredits(me.credits);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/auth/callback")) {
      return;
    }

    function onReturn() {
      const params = new URLSearchParams(window.location.search);
      // Login/signup already show their own failure toast for OAuth errors
      if (params.get("error") === "google") {
        recoverGoogleAuthUi({ announceCancel: false });
        return;
      }
      recoverGoogleAuthUi({ announceCancel: true });
    }

    function onVisible() {
      if (document.visibilityState === "visible") onReturn();
    }

    window.addEventListener("pageshow", onReturn);
    document.addEventListener("visibilitychange", onVisible);
    onReturn();

    void refresh().then(() => {
      if (typeof window === "undefined") return;
      if (sessionStorage.getItem("lyra.flash") === "signed-in") {
        sessionStorage.removeItem("lyra.flash");
        toast.success("Signed in successfully");
      }
    });

    return () => {
      window.removeEventListener("pageshow", onReturn);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const completeSession = useCallback(async (access: string) => {
    setSession(access);
    setLoading(true);
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
      if (typeof me.credits === "number") cacheCredits(me.credits);
      return me;
    } catch (err) {
      clearSession();
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ access_token: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      return completeSession(res.access_token);
    },
    [completeSession],
  );

  const signup = useCallback(
    async (full_name: string, email: string, password: string) => {
      const res = await api<{ access_token: string }>(
        "/api/auth/signup",
        { method: "POST", body: JSON.stringify({ full_name, email, password }) },
      );
      return completeSession(res.access_token);
    },
    [completeSession],
  );

  const value = useMemo(
    () => ({ user, loading, login, signup, completeSession, logout, refresh }),
    [user, loading, login, signup, completeSession, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
