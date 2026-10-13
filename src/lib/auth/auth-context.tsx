"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginResponse, LoginUser } from "@/lib/api/auth";

type AuthContextValue = {
  user: LoginUser | null;
  setSession: (response: LoginResponse) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);

  function setSession(response: LoginResponse) {
    setUser(response.user);
  }

  function clearSession() {
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      setSession,
      clearSession,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return context;
}