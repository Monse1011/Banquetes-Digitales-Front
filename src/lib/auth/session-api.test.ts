import {afterEach,describe,expect,it,vi} from "vitest";
import {restoreSession,closeSession} from "./session-api";
afterEach(()=>vi.unstubAllGlobals());
describe("session recovery",()=>{
  it("restores identity and first access from the cookie-backed server",async()=>{
    const session={user:{id_user:7,full_name:"Demo",role:"logistica"},firstAccess:false};
    const fetcher=vi.fn().mockResolvedValue(Response.json(session));vi.stubGlobal("fetch",fetcher);
    expect(await restoreSession()).toEqual(session);
    expect(fetcher).toHaveBeenCalledWith("/api/auth/first-access",expect.objectContaining({credentials:"same-origin",cache:"no-store"}));
  });
  it("treats an expired cookie as anonymous",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:401})));expect(await restoreSession()).toBeNull();
  });
  it("does not mistake a server failure for a valid session",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:500})));await expect(restoreSession()).rejects.toThrow();
  });
  it("rejects the old response without a verified identity",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({firstAccess:false})));await expect(restoreSession()).rejects.toThrow();
  });
  it("closes the HttpOnly cookie through the server",async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal("fetch",fetcher);
    await closeSession();expect(fetcher).toHaveBeenCalledWith("/api/auth/logout",expect.objectContaining({method:"POST",credentials:"same-origin"}));
  });
  it("does not report logout success when the server fails",async()=>{
    vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("offline")));await expect(closeSession()).rejects.toThrow("offline");
  });
});
