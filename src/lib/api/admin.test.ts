import { afterEach, describe, expect, it, vi } from "vitest";

import { approveAdminRequest } from "./admin";

describe("approveAdminRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envía la solicitud de aprobación al backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            request_id: 1,
            folio: "BD-2026-00002",
            status: "Aprobada",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await approveAdminRequest("test-token", 1);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/requests/1",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          status: "Aprobada",
        }),
      },
    );

    expect(result).toEqual({
      request_id: 1,
      folio: "BD-2026-00002",
      status: "Aprobada",
    });
  });
});