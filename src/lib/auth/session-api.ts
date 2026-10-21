import type {LoginUser} from "@/lib/api/auth";
export type RestoredSession = {user:LoginUser;firstAccess:boolean};
export async function restoreSession(signal?:AbortSignal):Promise<RestoredSession|null> {
  const response=await fetch("/api/auth/first-access",{credentials:"same-origin",cache:"no-store",signal});
  if(response.status===401)return null;
  if(!response.ok)throw new Error("No fue posible verificar la sesión. Intenta nuevamente.");
  const body=await response.json();
  if(!body.user || !["admin","logistica"].includes(body.user.role) || typeof body.firstAccess!=="boolean")throw new Error("El servidor no devolvió una sesión válida.");
  return body;
}
export async function closeSession():Promise<void>{
  const response=await fetch("/api/auth/logout",{method:"POST",credentials:"same-origin",cache:"no-store"});
  if(!response.ok)throw new Error("No fue posible cerrar la sesión. Intenta nuevamente.");
}
