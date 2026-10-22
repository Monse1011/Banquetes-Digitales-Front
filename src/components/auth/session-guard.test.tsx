import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { SessionGuard } from "./session-guard";
const state = vi.hoisted(() => ({
  isRestoring: false,
  sessionError: null as string | null,
  retrySession: vi.fn(),
  user: null as null | { role: "ADMIN" | "LOGISTICS" },
}));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => state }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
afterEach(() => {
  state.user = null;
  state.isRestoring = false;
  state.sessionError = null;
});
const render = (role: "ADMIN" | "LOGISTICS") =>
  renderToStaticMarkup(
    <SessionGuard role={role}>
      <p>CONTENIDO PRIVADO</p>
    </SessionGuard>,
  );
it("does not render either protected area without a session", () => {
  expect(render("ADMIN")).not.toContain("CONTENIDO PRIVADO");
  expect(render("LOGISTICS")).not.toContain("CONTENIDO PRIVADO");
});
it.each([
  ["ADMIN", "ADMIN", true],
  ["ADMIN", "LOGISTICS", true],
  ["LOGISTICS", "LOGISTICS", true],
  ["LOGISTICS", "ADMIN", false],
] as const)("user %s accessing %s: allowed=%s", (userRole, area, allowed) => {
  state.user = { role: userRole };
  expect(render(area).includes("CONTENIDO PRIVADO")).toBe(allowed);
});

it("waits for session recovery without rendering protected children", () => {
  state.isRestoring = true;
  expect(render("LOGISTICS")).toContain("Comprobando sesión");
  expect(render("LOGISTICS")).not.toContain("CONTENIDO PRIVADO");
});
it("offers recovery on server failure and keeps protected children hidden", () => {
  state.sessionError = "Error de conexión";
  expect(render("ADMIN")).toContain("Reintentar");
  expect(render("ADMIN")).not.toContain("CONTENIDO PRIVADO");
});
