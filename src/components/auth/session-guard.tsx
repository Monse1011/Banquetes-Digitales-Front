"use client";
import {useEffect,type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "../../lib/auth/auth-context";
export function SessionGuard({role,children}:{role:"admin"|"logistica";children:ReactNode}){
  const {user,loading,sessionError,firstAccess,retrySession}=useAuth();
  const router=useRouter();
  const allowed = user?.role === role || (role === "logistica" && user?.role === "admin");
  const destination=!user||firstAccess?"/login":!allowed?(user.role==="admin"?"/admin":"/logistics"):null;
  useEffect(()=>{if(!loading&&!sessionError&&destination)router.replace(destination);},[loading,sessionError,destination,router]);
  if(loading)return <main className="p-10" role="status">Verificando sesión…</main>;
  if(sessionError)return <main className="p-10"><p role="alert">{sessionError}</p><button className="mt-4 rounded border p-3" onClick={retrySession}>Reintentar</button></main>;
  if(destination)return <main className="p-10" role="status">Redirigiendo…</main>;
  return <>{children}</>;
}
