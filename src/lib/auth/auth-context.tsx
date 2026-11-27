"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSession, logout as logoutRequest, type SessionUser } from "@/lib/api/auth";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/http";

type AuthState = {
  user: SessionUser | null;
  firstAccess: boolean;
  loading: boolean;
  error: string;
  /** Marca de que la sesión terminó por expiración (para mostrar aviso en login). */
  expired: boolean;
};

type AuthContextValue = AuthState & {
  setSession: (user: SessionUser, firstAccess: boolean) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    firstAccess: false,
    loading: true,
    error: "",
    expired: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const session = await getSession();
      setState({
        user: session?.user ?? null,
        firstAccess: session?.firstAccess ?? false,
        loading: false,
        error: "",
        expired: false,
      });
    } catch (error) {
      setState((s) => ({
        ...s,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : "No fue posible verificar la sesión.",
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getSession(controller.signal)
      .then((session) =>
        setState({
          user: session?.user ?? null,
          firstAccess: session?.firstAccess ?? false,
          loading: false,
          error: "",
          expired: false,
        }),
      )
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: error instanceof Error ? error.message : "No fue posible verificar la sesión.",
        }));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onExpired = () => setState((s) => (s.user ? { ...s, user: null, firstAccess: false, expired: true } : s));
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const setSession = useCallback((user: SessionUser, firstAccess: boolean) => {
    setState({ user, firstAccess, loading: false, error: "", expired: false });
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setState({ user: null, firstAccess: false, loading: false, error: "", expired: false });
  }, []);

  const value = useMemo(() => ({ ...state, setSession, refresh, logout }), [state, setSession, refresh, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
