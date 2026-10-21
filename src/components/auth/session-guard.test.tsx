import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {beforeEach,describe,expect,it,vi} from "vitest";
import {SessionGuard} from "./session-guard";
const state=vi.hoisted(()=>({user:null as null|{role:string},loading:false,sessionError:"",firstAccess:false,retrySession:()=>{}}));
vi.mock("../../lib/auth/auth-context",()=>({useAuth:()=>state}));
vi.mock("next/navigation",()=>({useRouter:()=>({replace:vi.fn()})}));
beforeEach(()=>{state.user=null;state.loading=false;state.sessionError="";state.firstAccess=false;});
const render=(role:"admin"|"logistica"="admin")=>renderToStaticMarkup(<SessionGuard role={role}><div>CONTENIDO PRIVADO</div></SessionGuard>);
describe("protected layouts",()=>{
  it("hides children during session recovery",()=>{state.loading=true;expect(render()).not.toContain("CONTENIDO PRIVADO");});
  it("hides children without authentication in either layout",()=>{expect(render()).not.toContain("CONTENIDO PRIVADO");expect(render("logistica")).not.toContain("CONTENIDO PRIVADO");});
  it("hides admin pages from logistics",()=>{state.user={role:"logistica"};expect(render()).not.toContain("CONTENIDO PRIVADO");});
  it("allows admin to access logistics pages",()=>{state.user={role:"admin"};expect(render("logistica")).toContain("CONTENIDO PRIVADO");});
  it("hides pages until mandatory password change",()=>{state.user={role:"admin"};state.firstAccess=true;expect(render()).not.toContain("CONTENIDO PRIVADO");});
  it("hides pages and offers retry on server errors",()=>{state.sessionError="Servidor no disponible";expect(render()).toContain("Reintentar");expect(render()).not.toContain("CONTENIDO PRIVADO");});
  it("renders only the matching role after validation",()=>{state.user={role:"admin"};expect(render()).toContain("CONTENIDO PRIVADO");state.user={role:"logistica"};expect(render("logistica")).toContain("CONTENIDO PRIVADO");});
});
