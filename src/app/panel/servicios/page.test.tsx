import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import ServicesPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/servicios",
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

type Route = { status: number; body?: unknown };

function stubFetch(route: (url: string, init: RequestInitInit) => Route) {
  const calls: { url: string; method?: string; body?: unknown }[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInitInit = {}) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    const result = route(url, init);
    return new Response(result.body === undefined ? null : JSON.stringify(result.body), { status: result.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

type RequestInitInit = RequestInit & { body?: string };

const SERVICES = {
  data: {
    services: [
      { id: 1, name: "Banquetes y bebidas", description: "Menú completo", price: 1500, status: "ACTIVE" },
      { id: 2, name: "Servicio de personal", description: "Meseros", price: 800, status: "INACTIVE" },
    ],
  },
  metadata: { pagination: { total_records: 2, page: 1, per_page: 10 } },
};

const renderPage = () => render(<ToastProvider><ServicesPage /></ToastProvider>);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Gestión de servicios", () => {
  it("muestra el catálogo con estado y acciones según vigencia", async () => {
    stubFetch(() => ({ status: 200, body: SERVICES }));
    renderPage();
    expect((await screen.findAllByText("Banquetes y bebidas")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vigente").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No vigente").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Marcar como no vigente/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reactivar" }).length).toBeGreaterThan(0);
  });

  it("muestra el mensaje de catálogo vacío", async () => {
    stubFetch(() => ({ status: 200, body: { data: { services: [] }, metadata: { pagination: { total_records: 0, page: 1, per_page: 10 } } } }));
    renderPage();
    expect(await screen.findByText("No hay servicios registrados.")).toBeTruthy();
  });

  it("valida los campos obligatorios sin llamar al back", async () => {
    const calls = stubFetch((url) => ({ status: 200, body: url.includes("/api/admin/services") ? SERVICES : undefined }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir servicio/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByText("El nombre es obligatorio.")).toBeTruthy();
    expect(screen.getByText("La descripción breve es obligatoria.")).toBeTruthy();
    expect(screen.getByText(/El precio es obligatorio/)).toBeTruthy();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("muestra el mensaje de nombre duplicado en el campo", async () => {
    stubFetch((url, init) =>
      init.method === "POST"
        ? { status: 409, body: { message: "Ya existe un servicio vigente con ese nombre." } }
        : { status: 200, body: SERVICES },
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir servicio/ }));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Repetido" } });
    fireEvent.change(screen.getByLabelText(/Descripción breve/), { target: { value: "Algo" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect((await screen.findAllByText("Ya existe un servicio vigente con ese nombre.")).length).toBeGreaterThan(0);
  });

  it("guarda un servicio válido y confirma con el mensaje del requerimiento", async () => {
    const calls = stubFetch((url, init) =>
      init.method === "POST" ? { status: 201 } : { status: 200, body: SERVICES },
    );
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir servicio/ }));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Nuevo servicio" } });
    fireEvent.change(screen.getByLabelText(/Descripción breve/), { target: { value: "Algo breve" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "250.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST")).toBe(true));
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({ data: { name: "Nuevo servicio", description: "Algo breve", price: 250.5 } });
    expect(await screen.findByText("Servicio guardado exitosamente")).toBeTruthy();
  });

  it("cancelar con datos sin guardar pregunta antes de descartar", async () => {
    stubFetch(() => ({ status: 200, body: SERVICES }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Añadir servicio/ }));
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Borrador" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("¿Desea cancelar el registro?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(screen.queryByText("¿Desea cancelar el registro?")).toBeNull();
    expect(screen.getByLabelText(/Nombre/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("marca como no vigente solo al confirmar y reactiva sin confirmación", async () => {
    const calls = stubFetch((url, init) =>
      init.method === "PUT" ? { status: 204 } : { status: 200, body: SERVICES },
    );
    renderPage();
    fireEvent.click((await screen.findAllByRole("button", { name: /Marcar como no vigente/ }))[0]);
    expect(screen.getByText("¿Está seguro de que desea marcar este servicio como no vigente?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({ data: { status: "INACTIVE" } });
    expect(await screen.findByText("Servicio marcado como no vigente")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Reactivar" })[0]);
    await waitFor(() => expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2));
    expect(calls.filter((c) => c.method === "PUT")[1].body).toEqual({ data: { status: "ACTIVE" } });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await screen.findByText("Servicio reactivado exitosamente")).toBeTruthy();
  });
});
