import { afterEach, expect, it, vi } from "vitest";
import { approveAdminRequest, getAdminRequests } from "./admin";
afterEach(() => vi.restoreAllMocks());
it("requests the next server page and preserves its total and partial results", async () => {
  const response = {
    data: [{ request_id: 33, folio: "BD-2026-00007" }],
    metadata: { pagination: { total_records: 11, page: 2, per_page: 10 } },
  };
  const controller = new AbortController();
  const fetcher = vi.spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json(response));

  expect(await getAdminRequests({ page: 2, perPage: 10, signal: controller.signal }))
    .toEqual(response);
  expect(fetcher.mock.calls[0][0]).toBe("/api/admin/requests?page=2&per_page=10");
  expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
  expect(fetcher.mock.calls[0][1]?.credentials).toBe("same-origin");
});
it("supports a larger page size and keeps the initial page bounded by default", async () => {
  const fetcher = vi.spyOn(globalThis, "fetch")
    .mockImplementation(async () => Response.json({ data: [] }));
  await getAdminRequests({ page: 1, perPage: 25 });
  await getAdminRequests();
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "/api/admin/requests?page=1&per_page=25",
    "/api/admin/requests?page=1&per_page=10",
  ]);
});
it("approves with cookie credentials and unwraps the response array", async () => {
  const row = { request_id: 1, folio: "BD-2026-00002", status: "Aprobada" };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ data: [row] }));
  expect(await approveAdminRequest(1)).toEqual(row);
  expect(fetcher.mock.calls[0][0]).toBe("/api/admin/requests/1");
  expect(fetcher.mock.calls[0][1]?.credentials).toBe("same-origin");
  expect(fetcher.mock.calls[0][1]?.body).toBe(
    JSON.stringify({ status: "Aprobada" }),
  );
  expect(
    new Headers(fetcher.mock.calls[0][1]?.headers).has("Authorization"),
  ).toBe(false);
});
