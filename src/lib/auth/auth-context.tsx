"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import type {LoginResponse,LoginUser} from "@/lib/api/auth";
import {restoreSession,closeSession} from "./session-api";
type AuthContextValue={user:LoginUser|null;loading:boolean;sessionError:string;firstAccess:boolean;setSession:(response:LoginResponse)=>void;clearSession:()=>void;retrySession:()=>void;logout:()=>Promise<void>};
const AuthContext=createContext<AuthContextValue|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<LoginUser|null>(null);
  const [loading,setLoading]=useState(true);
  const [sessionError,setSessionError]=useState("");
  const [firstAccess,setFirstAccess]=useState(false);
  const [revision,setRevision]=useState(0);
  const generation=useRef(0);
  const setSession=useCallback((response:LoginResponse)=>{generation.current++;setUser(response.user);setFirstAccess(false);setSessionError("");setLoading(false);},[]);
  const clearSession=useCallback(()=>{generation.current++;setUser(null);setFirstAccess(false);setSessionError("");setLoading(false);},[]);
  useEffect(()=>{
    const controller=new AbortController();
    const current=++generation.current;
    restoreSession(controller.signal).then(session=>{
      if(current!==generation.current||controller.signal.aborted)return;
      setUser(session?.user??null);setFirstAccess(session?.firstAccess??false);setSessionError("");
    }).catch(error=>{
      if(current===generation.current&&!controller.signal.aborted){setUser(null);setSessionError(error instanceof Error?error.message:"No fue posible verificar la sesión.");}
    }).finally(()=>{if(current===generation.current&&!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[revision]);
  const retrySession=useCallback(()=>{setLoading(true);setSessionError("");setRevision(r=>r+1);},[]);
  const logout=useCallback(async()=>{await closeSession();clearSession();},[clearSession]);
  return <AuthContext.Provider value={{user,loading,sessionError,firstAccess,setSession,clearSession,retrySession,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error("useAuth debe utilizarse dentro de AuthProvider");return context;}
