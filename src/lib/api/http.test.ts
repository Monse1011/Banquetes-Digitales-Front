import { afterEach, expect, it, vi } from "vitest";
import { apiRequest, SESSION_EXPIRED_EVENT } from "./http";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it.each([201, 204])(
  "accepts empty %s responses when requested",
  async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status }),
    );
    await expect(
      apiRequest("/api/resources", { responseType: "empty" }),
    ).resolves.toBeUndefined();
  },
);
it("preserves conflict fields and validation errors", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(
      {
        message: "Conflicto",
        requires_confirmation: true,
        errors: { name: "Duplicado" },
      },
      { status: 409 },
    ),
  );
  await expect(apiRequest("/api/resources")).rejects.toMatchObject({
    status: 409,
    message: "Conflicto",
    details: { requires_confirmation: true, errors: { name: "Duplicado" } },
  });
});
it("uses a readable fallback for non-JSON errors", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response("<html>Bad gateway</html>", { status: 502 }),
  );
  await expect(
    apiRequest("/api/resources", { fallback: "Servidor no disponible" }),
  ).rejects.toMatchObject({ status: 502, message: "Servidor no disponible" });
});
it("only invalidates the local session for protected 401 responses", async () => {
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { dispatchEvent });
  vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    Response.json({ message: "Sin sesión" }, { status: 401 }),
  );
  await apiRequest("/api/auth/login", { auth: false }).catch(() => {});
  expect(dispatchEvent).not.toHaveBeenCalled();
  await apiRequest("/api/admin/users").catch(() => {});
  expect(dispatchEvent.mock.calls[0][0].type).toBe(SESSION_EXPIRED_EVENT);
});
it("supports text and PDF responses", async () => {
  vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response("OK"))
    .mockResolvedValueOnce(
      new Response("pdf", { headers: { "Content-Type": "application/pdf" } }),
    );
  expect(await apiRequest("/api/send", { responseType: "text" })).toBe("OK");
  expect(
    (await apiRequest<Blob>("/api/download", { responseType: "blob" })).type,
  ).toBe("application/pdf");
});
it("preserves cancellation", async () => {
  const signal = new AbortController().signal;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new DOMException("Aborted", "AbortError"));
  await expect(apiRequest("/api/list", { signal })).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(fetcher.mock.calls[0][1]?.signal).toBe(signal);
});
