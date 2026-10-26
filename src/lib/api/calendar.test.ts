import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmProposalAndSchedule, getCalendarEvents, eventOccupiesDay, editCalendarEvent, cancelCalendarEvent, retryCalendarSync } from "./calendar";
afterEach(() => vi.unstubAllGlobals());
const row = {event_id: 9, request_id: 15, folio: "BD-2026-00006", title: "Evento", location: "Lugar", start_datetime: "2026-10-31 18:00:00", end_datetime: "2026-11-01 01:00:00", logistics_responsible: {user_id: 3, full_name: "Luis"}, status: "Confirmado", sync_status: "Pendiente de sincronización"};
describe("calendar API", () => {
  it("confirms through the calendar endpoint without inventing accepted data", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({data: {event_id:9, status:"Confirmado"}}, {status:201}));
    vi.stubGlobal("fetch",fetch);
    await expect(confirmProposalAndSchedule(15)).resolves.toMatchObject({data: {event_id:9}});
    expect(fetch.mock.calls[0][0]).toBe("/api/logistics/requests/15/calendar");
    expect(fetch.mock.calls[0][1]).toMatchObject({method:"POST",credentials:"same-origin"});
    expect(fetch.mock.calls[0][1].body).toBeUndefined();
  });
  it("loads all pages and preserves pending sync and Merida wall-clock times", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({data:{events:[row]}, metadata:{pagination:{total_records:2}}})).mockResolvedValueOnce(Response.json({data:{events:[{...row,event_id:10}]},metadata:{pagination:{total_records:2}}}));
    vi.stubGlobal("fetch",fetch);
    const events = await getCalendarEvents(false);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({status:"CONFIRMED",sync_status:"PENDING",start_datetime:"2026-10-31T18:00:00",request_numeric_id:15});
    expect(fetch.mock.calls[1][0]).toContain("page=2");
  });
  it("uses the administrator endpoint for the complete calendar", async () => {
    const fetch=vi.fn().mockResolvedValue(Response.json({data:{events:[]},metadata:{pagination:{total_records:0}}}));
    vi.stubGlobal("fetch",fetch);
    expect(await getCalendarEvents(true)).toEqual([]);
    expect(fetch.mock.calls[0][0]).toContain("/api/admin/calendar?");
  });
  it("surfaces availability conflicts without retrying confirmation", async () => {
    const fetch=vi.fn().mockResolvedValue(Response.json({message:"Sin disponibilidad"},{status:409}));
    vi.stubGlobal("fetch",fetch);
    await expect(confirmProposalAndSchedule(15)).rejects.toMatchObject({status:409});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("shows overnight events on each occupied day, excluding an exact midnight end", () => {
    const event={start_datetime:"2026-10-31T18:00:00",end_datetime:"2026-11-01T01:00:00"};
    expect(eventOccupiesDay(event,"2026-10-31")).toBe(true);
    expect(eventOccupiesDay(event,"2026-11-01")).toBe(true);
    expect(eventOccupiesDay(event,"2026-11-02")).toBe(false);
    expect(eventOccupiesDay({...event,end_datetime:"2026-11-01T00:00:00"},"2026-11-01")).toBe(false);
  });
});

it("saves explicit Merida timestamps and accepts empty edit/cancel responses", async () => {
  const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(null, {status:200})));
  vi.stubGlobal("fetch", fetch);
  const values = {location:"Nuevo lugar", start_datetime:"2035-06-01T18:00:00-06:00", end_datetime:"2035-06-02T01:00:00-06:00"};
  await editCalendarEvent(9, values);
  expect(fetch.mock.calls[0][0]).toBe("/api/logistics/calendar/9");
  expect(fetch.mock.calls[0][1].method).toBe("PATCH");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({data:values});
  await cancelCalendarEvent(9);
  expect(fetch.mock.calls[1][1].method).toBe("DELETE");
  expect(fetch.mock.calls[1][1].body).toBeUndefined();
});
it("propagates edit and cancellation failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(Response.json({message:"Conflicto"}, {status:409}))));
  await expect(editCalendarEvent(9, {location:"Lugar",start_datetime:"2035-06-01T18:00:00-06:00",end_datetime:"2035-06-01T20:00:00-06:00"})).rejects.toMatchObject({status:409});
  await expect(cancelCalendarEvent(9)).rejects.toMatchObject({status:409});
});

it("requests one manual retry and preserves the pending result", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({data:{event_id:9,sync_status:"PENDING"},message:"Pendiente"}));
  vi.stubGlobal("fetch",fetch);
  expect((await retryCalendarSync(9)).data.sync_status).toBe("PENDING");
  expect(fetch.mock.calls[0][0]).toBe("/api/logistics/calendar/9/sync");
  expect(fetch.mock.calls[0][1].method).toBe("POST");
  expect(fetch).toHaveBeenCalledTimes(1);
});
