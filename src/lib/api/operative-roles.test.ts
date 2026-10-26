import { afterEach, expect, it, vi } from "vitest";
import { getActiveOperativeRoles, getOperativeRole, saveOperativeRole, deactivateOperativeRole, operativeRoleError } from "./operative-roles";

afterEach(() => vi.unstubAllGlobals());
it("loads real active roles and counts human resources across all pages", async () => {
  const fetch = vi.fn(async (path: string) => {
    if (path.endsWith("operative-roles")) return Response.json({data:{roles:[{id:1,name:"Chef"},{id:2,name:"Mesero"}]}});
    const second = path.includes("page=2&");
    return Response.json({data:{resources:[{id: second ? 11 : 10, operative_role_id:"1",is_active:true}]},metadata:{pagination:{total_records:2}}});
  });
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  expect(await getActiveOperativeRoles(controller.signal)).toEqual([
    {id:1,name:"Chef",is_active:true,active_human_resources_count:2},
    {id:2,name:"Mesero",is_active:true,active_human_resources_count:0},
  ]);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls.map(([path]) => path)).toContain("/api/admin/resources/human?status=active&page=2&per_page=100");
});
it("returns an empty catalog without fabricated roles", async () => {
  vi.stubGlobal("fetch", vi.fn(async (path: string) => Response.json(path.endsWith("operative-roles") ? {data:{roles:[]}} : {data:{resources:[]},metadata:{pagination:{total_records:0}}})));
  expect(await getActiveOperativeRoles()).toEqual([]);
});
it("surfaces count failures instead of claiming zero assigned people", async () => {
  vi.stubGlobal("fetch", vi.fn(async (path: string) => path.endsWith("operative-roles") ? Response.json({data:{roles:[{id:1,name:"Chef"}]}}) : Response.json({message:"Error de consulta"},{status:500})));
  await expect(getActiveOperativeRoles()).rejects.toMatchObject({status:500,message:"Error de consulta"});
});

it("creates with the backend data envelope and accepts an empty 201", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, {status: 201}));
  vi.stubGlobal("fetch", fetch);
  await expect(saveOperativeRole({name:"  Chef ejecutivo  "})).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith("/api/admin/resources/operative-roles", expect.objectContaining({
    method:"POST", body:JSON.stringify({data:{name:"Chef ejecutivo"}}), credentials:"same-origin",
  }));
});
it("reads the current role and uses PATCH to rename it without changing status", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({data:{role:{id:"7",name:"Chef",is_active:true}}}))
    .mockResolvedValueOnce(new Response(null,{status:204}));
  vi.stubGlobal("fetch", fetch);
  expect(await getOperativeRole(7)).toEqual({id:7,name:"Chef",is_active:true});
  await saveOperativeRole({name:"Cocinero"},7);
  expect(fetch).toHaveBeenNthCalledWith(2,"/api/admin/resources/operative-roles/7",expect.objectContaining({
    method:"PATCH",body:JSON.stringify({data:{name:"Cocinero"}}),
  }));
});
it("deactivates through DELETE with no invented reactivation body", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null,{status:204}));
  vi.stubGlobal("fetch", fetch);
  await deactivateOperativeRole(7);
  expect(fetch).toHaveBeenCalledWith("/api/admin/resources/operative-roles/7",expect.objectContaining({method:"DELETE"}));
  expect(fetch.mock.calls[0][1]).not.toHaveProperty("body");
});
it("exposes the specific duplicate-name validation instead of the generic error", async () => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({
    message:"Datos inválidos",errors:{name:"Ya existe un rol operativo con ese nombre."},
  },{status:422})));
  const error = await saveOperativeRole({name:"Chef"}).catch(error => error);
  expect(error.status).toBe(422);
  expect(operativeRoleError(error)).toBe("Ya existe un rol operativo con ese nombre.");
});
it.each([403,404,500])("does not treat a failed mutation (%s) as success",async (status) => {
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json({message:"Operación rechazada"},{status})));
  await expect(deactivateOperativeRole(7)).rejects.toMatchObject({status,message:"Operación rechazada"});
});
