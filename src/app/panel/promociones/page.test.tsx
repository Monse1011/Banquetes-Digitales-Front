import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import PromotionsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/promociones",
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, employeeId: "E001", fullName: "Ana Admin", email: "a@x.co", role: "ADMIN" },
    firstAccess: false,
    loading: false,
    error: null,
    expired: false,
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

type RequestInitInit = RequestInit & { body?: string };

function stubFetch(route: (url: string, init: RequestInitInit) => { status: number; body?: unknown }) {
  const calls: { url: string; method?: string; body?: unknown }[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInitInit = {}) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const result = route(url, init);
    return new Response(result.body === undefined ? null : JSON.stringify(result.body), { status: result.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const PROMOTIONS = {
  data: {
    promotions: [
      { id: 1, name: "Descuento de temporada", description: "Aplica en temporada.", discount_percentage: 10, valid_until: "2026-12-31", status: "ACTIVE" },
      { id: 2, name: "Promoción de verano", description: "Aplica en verano.", discount_percentage: 5, valid_until: "2026-08-31", status: "INACTIVE" },
    ],
  },
  metadata: { pagination: { total_records: 2, page: 1, per_page: 10 } },
};

const renderPage = () => render(<ToastProvider><PromotionsPage /></ToastProvider>);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Gestión de promociones", () => {
  it("muestra descuento y vigencia; las no vigentes solo ofrecen Eliminar", async () => {
    stubFetch(() => ({ status: 200, body: PROMOTIONS }));
    renderPage();
    expect((await screen.findAllByText("Descuento de temporada")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("10.00%").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Eliminar" })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: /Marcar como no vigente/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Reactivar" })).toBeNull();
  });

  it("muestra el mensaje de catálogo vacío", async () => {
    stubFetch(() => ({ status: 200, body: { data: { promotions: [] }, metadata: { pagination: { total_records: 0, page: 1, per_page: 10 } } } }));
    renderPage();
    expect(await screen.findByText("No hay promociones registradas.")).toBeTruthy();
  });

  it("rechaza una fecha de vigencia anterior a hoy", async () => {
    const calls = stubFetch(() => ({ status: 200, body: PROMOTIONS }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir promoción/ }));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Nueva" } });
    fireEvent.change(screen.getByLabelText(/Descripción breve/), { target: { value: "Algo" } });
    fireEvent.change(screen.getByLabelText(/Descuento/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Fecha de vigencia/), { target: { value: "2020-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText("La fecha de vigencia no puede ser anterior a la fecha actual.")).toBeTruthy();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("guarda una promoción válida con el mensaje del requerimiento", async () => {
    const calls = stubFetch((url, init) => (init.method === "POST" ? { status: 201 } : { status: 200, body: PROMOTIONS }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir promoción/ }));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Nueva promoción" } });
    fireEvent.change(screen.getByLabelText(/Descripción breve/), { target: { value: "Algo" } });
    fireEvent.change(screen.getByLabelText(/Descuento/), { target: { value: "12.50" } });
    fireEvent.change(screen.getByLabelText(/Fecha de vigencia/), { target: { value: "2027-01-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      data: { name: "Nueva promoción", description: "Algo", discount_percentage: 12.5, valid_until: "2027-01-31" },
    });
    expect(await screen.findByText("Promoción guardada exitosamente")).toBeTruthy();
  });

  it("marca como no vigente con confirmación y mensaje", async () => {
    const calls = stubFetch((url, init) => (init.method === "PUT" ? { status: 204 } : { status: 200, body: PROMOTIONS }));
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: /Marcar como no vigente/ }))[0]);
    expect(screen.getByText("¿Está seguro de que desea marcar esta promoción como no vigente?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({ data: { status: "INACTIVE" } });
    expect(await screen.findByText("Promoción marcada como no vigente")).toBeTruthy();
  });
});
