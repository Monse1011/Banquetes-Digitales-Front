import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, buildUrl, extractMessage, SESSION_EXPIRED_EVENT } from "./http";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("buildUrl", () => {
  it("omite parámetros vacíos", () => {
    expect(buildUrl("/api/x", { a: 1, b: "", c: undefined, d: null, e: false })).toBe("/api/x?a=1&e=false");
  });
});

describe("extractMessage", () => {
  it("entiende los formatos de error del back", () => {
    expect(extractMessage({ message: "m" })).toBe("m");
    expect(extractMessage({ error: "e" })).toBe("e");
    expect(extractMessage({ error: { message: "anidado" } })).toBe("anidado");
    expect(extractMessage({})).toBeUndefined();
  });
});

describe("api", () => {
  it("envía JSON con credenciales del mismo origen", async () => {
    const fetchMock = mockFetch(200, { data: 1 });
    await expect(api("/api/a", { method: "POST", body: { x: 1 } })).resolves.toEqual({ data: 1 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBe('{"x":1}');
  });

  it("devuelve undefined en 204", async () => {
    mockFetch(204);
    await expect(api("/api/a")).resolves.toBeUndefined();
  });

  it("lanza ApiError con errores por campo", async () => {
    mockFetch(422, { message: "Error de validación", errors: { phone: "mal" } });
    const error = await api("/api/a").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.fieldErrors).toEqual({ phone: "mal" });
  });

  it("notifica sesión expirada en 401", async () => {
    mockFetch(401, {});
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    await api("/api/a").catch(() => undefined);
    await api("/api/a", { auth: false }).catch(() => undefined);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("rechaza rutas fuera de /api", async () => {
    await expect(api("https://evil.example/api")).rejects.toThrow();
  });
});
