import { afterEach, expect, it, vi } from "vitest";
import { approveAdminRequest } from "./admin";
afterEach(() => vi.restoreAllMocks());
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
