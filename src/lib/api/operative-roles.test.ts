import { afterEach, expect, it, vi } from "vitest";
import { getActiveOperativeRoles } from "./operative-roles";

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
