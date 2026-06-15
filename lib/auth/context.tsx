"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Attempt silent refresh on page load ──────────────────────────────
  const silentRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.access_token) {
        // Decode user info from JWT payload (no secret needed for payload)
        const payload = JSON.parse(atob(data.access_token.split(".")[1]));
        setUser({ id: payload.sub, email: payload.email });
        setAccessToken(data.access_token);
        // Schedule next refresh 5 minutes before expiry (default Supabase JWT = 1 hour)
        scheduleRefresh(payload.exp);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Schedule automatic token rotation ────────────────────────────────
  const scheduleRefresh = useCallback(
    (expTimestamp: number) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      const msUntilExpiry = expTimestamp * 1000 - Date.now();
      const refreshIn = Math.max(msUntilExpiry - 5 * 60 * 1000, 0); // 5 min before expiry
      refreshTimerRef.current = setTimeout(silentRefresh, refreshIn);
    },
    [silentRefresh]
  );

  // ── On mount: try to restore session from cookie ─────────────────────
  useEffect(() => {
    silentRefresh().finally(() => setLoading(false));
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ─────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Login failed." };

      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      setUser({ id: payload.sub, email: payload.email });
      setAccessToken(data.access_token);
      scheduleRefresh(payload.exp);
      return {};
    },
    [scheduleRefresh]
  );

  // ── Signup ────────────────────────────────────────────────────────────
  const signup = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Sign-up failed." };
      return {};
    },
    []
  );

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccessToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
