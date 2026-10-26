import { afterEach, describe, expect, it, vi } from "vitest";
import { assignRequest, reassignRequest, assignmentError, getAssignmentDetail, getAssignmentRequests, getEligibleLogisticsUsers } from "./assignments";
afterEach(() => vi.unstubAllGlobals());
describe("assignment HTTP contracts", () => {
  it("accepts the backend's plain-text assignment success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(assignRequest(4, 2)).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/requests/4/assignment");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ data: { user_id: 2 } });
  });
  it("loads approved requests across pages", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: [{ request_id: 1 }], metadata: { pagination: { total_records: 2 } } }))
      .mockResolvedValueOnce(Response.json({ data: [{ request_id: 2 }], metadata: { pagination: { total_records: 2 } } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await getAssignmentRequests()).toHaveLength(2);
    expect(fetchMock.mock.calls[1][0]).toContain("status=APPROVED&page=2");
  });
  it("reads array-wrapped detail and formats the event in Merida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{ request_id: 4, event_date_time: "2035-01-02T02:00:00Z", event_end_time: "2035-01-02T07:00:00Z" }] })));
    expect(await getAssignmentDetail(4)).toMatchObject({ event_date: "2035-01-01", start_time: "20:00", end_time: "01:00" });
  });
  it("does not invent users when the endpoint returns none", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { users: [] } })));
    expect(await getEligibleLogisticsUsers()).toEqual([]);
  });
  it("preserves assignment errors instead of reporting success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "Responsable no disponible" }, { status: 409 })));
    await expect(assignRequest(4, 2)).rejects.toThrow("Responsable no disponible");
  });
});

it("loads assigned requests using the existing status filter", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({data:[],metadata:{pagination:{total_records:0}}}));
  vi.stubGlobal("fetch", fetch);
  await getAssignmentRequests("ASSIGNED");
  expect(fetch.mock.calls[0][0]).toContain("status=ASSIGNED&page=1");
});
it("sends the expected responsible separately from the URL request ID", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response("OK"));
  vi.stubGlobal("fetch", fetch);
  await reassignRequest(15, 8, 3);
  expect(fetch.mock.calls[0][0]).toBe("/api/admin/requests/15/assignment");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({data:{user_id:8,request_id:3}});
});
it("shows overlap details and never retries a rejected reassignment", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({message:"No disponible",conflict:{folio:"BD-2",event_date:"2035-01-01",start_time:"17:00",end_time:"21:00"}}, {status:409}));
  vi.stubGlobal("fetch", fetch);
  const error = await reassignRequest(15, 8, 3).catch((e: unknown) => e);
  expect(assignmentError(error)).toContain("BD-2, 2035-01-01, 17:00–21:00");
  expect(fetch).toHaveBeenCalledTimes(1);
});
