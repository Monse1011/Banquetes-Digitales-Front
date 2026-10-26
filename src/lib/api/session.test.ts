import { afterEach, expect, it, vi } from "vitest";
import { getSession, logout } from "./auth";
const user = { id_user: 1, id_employee: "371", full_name: "Test", email: "t@example.com", role: "LOGISTICS" };
afterEach(() => vi.unstubAllGlobals());
it("recovers the server identity using the cookie without cached responses", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ user, firstAccess: false })));
  vi.stubGlobal("fetch", fetch);
  expect(await getSession()).toMatchObject({ user });
  expect(fetch).toHaveBeenCalledWith("/api/auth/session", expect.objectContaining({ credentials: "same-origin", cache: "no-store" }));
});
it("returns anonymous for an expired cookie", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
  expect(await getSession()).toBeNull();
});
it("keeps first-access users in the password-change login flow", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user, firstAccess: true }))));
  expect(await getSession()).toBeNull();
});
it.each([500, 503])("propagates server failure %s so the screen can retry instead of redirecting", async (status) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })));
  await expect(getSession()).rejects.toMatchObject({ status });
});
it("propagates a network failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await expect(getSession()).rejects.toThrow("offline");
});
it("clears the cookie through the server logout endpoint", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  await logout();
  expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST", credentials: "same-origin" }));
});
