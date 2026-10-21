"use client";
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { getSession, type LoginResponse, type LoginUser } from "@/lib/api/auth";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/http";
type AuthContextValue = {
  user: LoginUser | null;
  isRestoring: boolean;
  sessionError: string | null;
  retrySession: () => void;
  setSession: (response: LoginResponse) => void;
  clearSession: () => void;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const revision = useRef(0);
  const clearSession = useCallback(() => {
    revision.current += 1;
    setUser(null);
    setIsRestoring(false);
    setSessionError(null);
  }, []);
  const restoreSession = useCallback(() => {
    const current = ++revision.current;
    return getSession().then(
      (session) => {
        if (current === revision.current) {
          setUser(session?.user ?? null);
          setIsRestoring(false);
        }
      },
      () => {
        if (current === revision.current) {
          setSessionError("No pudimos comprobar tu sesión. Revisa la conexión e intenta nuevamente.");
          setIsRestoring(false);
        }
      },
    );
  }, []);
  useEffect(() => {
    void restoreSession();
    return () => { revision.current += 1; };
  }, [restoreSession]);
  const retrySession = useCallback(() => {
    setIsRestoring(true);
    setSessionError(null);
    void restoreSession();
  }, [restoreSession]);
  const setSession = useCallback((response: LoginResponse) => {
    if (!["ADMIN", "LOGISTICS"].includes(response.user.role))
      throw new Error("El rol recibido no permite acceder al sistema.");
    revision.current += 1;
    setUser(response.user);
    setIsRestoring(false);
    setSessionError(null);
  }, []);
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, clearSession);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, clearSession);
  }, [clearSession]);
  return (
    <AuthContext.Provider value={{ user, setSession, clearSession, isRestoring, sessionError, retrySession }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  return context;
}
