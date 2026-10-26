import { afterEach, expect, it, vi } from "vitest";
import {
  login,
  getFirstAccess,
  changePassword,
  resetPassword,
  homeForRole,
} from "./auth";
afterEach(() => vi.restoreAllMocks());
it("logs in with the actual payload and checks first access separately", async () => {
  const user = { role: "LOGISTICS" };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ user }))
    .mockResolvedValueOnce(Response.json({ firstAccess: true }));
  expect(await login({ employeeId: "001", password: "temporary" })).toEqual({
    user,
  });
  expect(await getFirstAccess()).toEqual({ firstAccess: true });
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual({
    employeeId: "001",
    password: "temporary",
  });
  expect(homeForRole("LOGISTICS")).toBe("/logistics");
  expect(homeForRole("ADMIN")).toBe("/admin");
});
it("uses password/new_password for authenticated password changes", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({ user: {} }));
  await changePassword("old", "new");
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual({
    password: "old",
    new_password: "new",
  });
  expect(
    new Headers(fetcher.mock.calls[0][1]?.headers).has("Authorization"),
  ).toBe(false);
});
it("passes the reset token only to the reset endpoint", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json({}));
  await resetPassword("reset-token", "new");
  expect(fetcher.mock.calls[0][0]).toBe("/api/auth/reset-password");
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual({
    token: "reset-token",
    new_password: "new",
  });
});
