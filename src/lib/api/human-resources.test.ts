import { afterEach, describe, expect, it, vi } from "vitest";
import { listHumanResources, saveHumanResource, setHumanResourceActive, ResourceApiError, listOperativeRoles } from "./human-resources";

afterEach(() => vi.unstubAllGlobals());
describe("RH real API contract", () => {
  it("accepts empty 201 and 204 responses and wraps write fields in data", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, {status:201})).mockResolvedValueOnce(new Response(null, {status:204})).mockResolvedValueOnce(new Response(null, {status:204}));
    vi.stubGlobal("fetch", fetcher);
    const values = {name:" Ana ",operative_role_id:2};
    await saveHumanResource(values);
    await saveHumanResource(values, 7);
    await setHumanResourceActive(7,false);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({data:{name:"Ana",operative_role_id:2}});
    expect(fetcher.mock.calls[1][1].method).toBe("PATCH");
    expect(fetcher.mock.calls[2][1].method).toBe("PUT");
    expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({data:{is_active:false}});
  });
  it("requires explicit duplicate confirmation, never silently retries", async () => {
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({message:"Duplicado",requires_confirmation:true}),{status:409}));
    vi.stubGlobal("fetch",fetcher);
    await expect(saveHumanResource({name:"Ana",operative_role_id:2})).rejects.toMatchObject({requiresConfirmation:true});
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not treat a concurrency conflict as a duplicate", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({message:"Conflicto"}),{status:409})));
    try { await saveHumanResource({name:"Ana",operative_role_id:2},7); } catch(e) { expect(e).toBeInstanceOf(ResourceApiError); expect((e as ResourceApiError).requiresConfirmation).toBe(false); }
  });
  it("sends confirmation only when explicitly requested", async () => {
    const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:201}));vi.stubGlobal("fetch",fetcher);
    await saveHumanResource({name:"Ana",operative_role_id:2},undefined,true);
    expect(JSON.parse(fetcher.mock.calls[0][1].body).data.confirm_duplicate).toBe(true);
  });
  it("loads every page using the actual nested response", async () => {
    const fetcher=vi.fn().mockResolvedValueOnce(Response.json({data:{resources:[{id:1}]},metadata:{pagination:{total_records:2}}})).mockResolvedValueOnce(Response.json({data:{resources:[{id:2}]},metadata:{pagination:{total_records:2}}}));
    vi.stubGlobal("fetch",fetcher);
    expect(await listHumanResources("active")).toEqual([{id:1},{id:2}]);
    expect(fetcher.mock.calls[1][0]).toContain("page=2");
    expect(fetcher.mock.calls[0][1].credentials).toBe("same-origin");
  });
  it("does not substitute fake roles when the catalog fails", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(null,{status:500})));
    await expect(listOperativeRoles()).rejects.toThrow();
  });
});
