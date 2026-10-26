"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { homeForRole, type LoginUser } from "@/lib/api/auth";
export function SessionGuard({
  role,
  children,
}: {
  role: LoginUser["role"];
  children: ReactNode;
}) {
  const { user, isRestoring, sessionError, retrySession } = useAuth();
  const router = useRouter();
  const allowed = user?.role === role || (role === "LOGISTICS" && user?.role === "ADMIN");
  const destination = isRestoring || sessionError ? null : !user
    ? "/login"
    : !allowed
      ? homeForRole(user.role)
      : null;
  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);
  if (isRestoring) return <p role="status" className="p-8">Comprobando sesión…</p>;
  if (sessionError) return (
    <div className="p-8">
      <p role="alert">{sessionError}</p>
      <button className="mt-4 underline" onClick={retrySession}>Reintentar</button>
    </div>
  );
  return destination ? null : children;
}
