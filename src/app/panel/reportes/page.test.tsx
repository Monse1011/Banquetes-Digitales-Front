import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import ReportsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/panel/reportes",
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

const REPORT_BODY = {
  data: {
    report: {
      type: "REQUESTS",
      title: "Solicitudes de reservación recibidas",
      filters: { period_type: "NONE" },
      generated_at: "2026-10-25T22:30:00-06:00",
      summary: { total: 2 },
      table: [
        { folio: "BD-2026-00012", client_name: "Ana López", request_date: "2026-10-03T10:15:00-06:00", event_date: "2026-11-14", status: "PENDING" },
        { folio: "BD-2026-00013", client_name: "Luis Pérez", request_date: "2026-10-05T16:40:00-06:00", event_date: "2026-12-02", status: "APPROVED" },
      ],
      chart: {
        type: "bar",
        x_label: "Día",
        y_label: "Solicitudes",
        buckets: [
          { label: "2026-10-01", count: 0 },
          { label: "2026-10-03", count: 1 },
        ],
        note: "Se muestran 2 de 31 intervalos.",
      },
    },
  },
};

function stubFetch(reportResponse: () => { status: number; body?: unknown }) {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInitInit = {}) => {
    void init;
    calls.push(url);
    if (url.startsWith("/api/admin/reports/export")) return new Response("xlsx", { status: 200 });
    if (url.startsWith("/api/admin/reports")) {
      const result = reportResponse();
      return new Response(result.body === undefined ? null : JSON.stringify(result.body), { status: result.status });
    }
    if (url.startsWith("/api/admin/clients")) {
      return new Response(JSON.stringify({ data: { clients: [{ email: "ana@x.co", name: "Ana López" }] } }), { status: 200 });
    }
    if (url.startsWith("/api/admin/services")) {
      return new Response(JSON.stringify({ data: { services: [{ id: 3, name: "Banquetes", description: "d", price: 10, status: "INACTIVE" }] } }), { status: 200 });
    }
    if (url.startsWith("/api/admin/promotions")) {
      return new Response(JSON.stringify({ data: { promotions: [] } }), { status: 200 });
    }
    return new Response(null, { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const renderPage = () => render(<ToastProvider><ReportsPage /></ToastProvider>);

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("Generación de reportes", () => {
  it("sin tipo seleccionado no permite generar y no muestra filtros", () => {
    stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    expect((screen.getByRole("button", { name: /Generar reporte/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByLabelText(/Tipo de periodo/)).toBeNull();
    expect(screen.queryByLabelText(/Cliente/)).toBeNull();
  });

  it("muestra solo los filtros aplicables al tipo (RF-1.2.15.3)", async () => {
    stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    expect(await screen.findByLabelText(/Tipo de periodo/)).toBeTruthy();
    expect(await screen.findByLabelText(/Cliente/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Servicio/)).toBeNull();
    expect(screen.queryByLabelText(/^Promoción/)).toBeNull();

    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "EVENTS" } });
    expect(await screen.findByLabelText(/^Servicio/)).toBeTruthy();
    expect(await screen.findByLabelText(/^Promoción/)).toBeTruthy();
    // El servicio inactivo se ofrece con su etiqueta
    const serviceSelect = screen.getByLabelText(/^Servicio/) as HTMLSelectElement;
    expect(Array.from(serviceSelect.options).map((o) => o.textContent)).toContain("Banquetes (No vigente)");
  });

  it("valida el rango de fechas sin llamar al back (RF-1.2.15.3.10)", async () => {
    const calls = stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.change(await screen.findByLabelText(/Tipo de periodo/), { target: { value: "RANGE" } });
    fireEvent.change(screen.getByLabelText(/Desde/), { target: { value: "2026-10-10" } });
    fireEvent.change(screen.getByLabelText(/Hasta/), { target: { value: "2026-10-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar reporte/ }));
    expect(screen.getByText("El rango seleccionado es inválido.")).toBeTruthy();
    expect(calls.filter((url) => url.startsWith("/api/admin/reports?"))).toHaveLength(0);
  });

  it("el periodo por mes se captura con selectores de mes y año (RF-1.2.15.3.8)", async () => {
    const calls = stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.change(await screen.findByLabelText(/Tipo de periodo/), { target: { value: "MONTH" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar reporte/ }));
    expect(screen.getByText("Selecciona el mes y el año del periodo.")).toBeTruthy();
    expect(calls.filter((url) => url.startsWith("/api/admin/reports?"))).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/^Mes/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/^Año/), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar reporte/ }));
    await waitFor(() => expect(calls.some((url) => url.startsWith("/api/admin/reports?"))).toBe(true));
    expect(calls.find((url) => url.startsWith("/api/admin/reports?"))).toContain("month=2026-10");
  });

  it("genera el reporte con tabla, resumen y gráfica; cambiar un filtro lo retira (RF-1.2.15.6.4)", async () => {
    const calls = stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.click(await screen.findByRole("button", { name: /Generar reporte/ }));

    expect(await screen.findByRole("heading", { name: "Solicitudes de reservación recibidas" })).toBeTruthy();
    expect(screen.getByText(/Total: 2 solicitudes recibidas/)).toBeTruthy();
    expect(screen.getAllByText("BD-2026-00012").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: /Gráfica de barras/ })).toBeTruthy();
    expect(screen.getByText("Se muestran 2 de 31 intervalos.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exportar a Excel/ })).toBeTruthy();
    expect(calls.find((url) => url.startsWith("/api/admin/reports?"))).toContain("type=REQUESTS");

    fireEvent.change(screen.getByLabelText(/Cliente/), { target: { value: "ana@x.co" } });
    await waitFor(() => expect(screen.queryByText("BD-2026-00012")).toBeNull());
    expect(screen.queryByRole("button", { name: /Exportar a Excel/ })).toBeNull();
  });

  it("sin resultados muestra el mensaje y oculta tabla y exportación (RF-1.2.15.8)", async () => {
    const empty = { ...REPORT_BODY, data: { report: { ...REPORT_BODY.data.report, table: [], chart: null, summary: { total: 0 } } } };
    stubFetch(() => ({ status: 200, body: empty }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.click(await screen.findByRole("button", { name: /Generar reporte/ }));
    expect(await screen.findByText("No se encontraron resultados para los criterios seleccionados.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Exportar a Excel/ })).toBeNull();
  });

  it("exporta el reporte mostrado y confirma en ventana emergente (RF-1.2.15.7)", async () => {
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const calls = stubFetch(() => ({ status: 200, body: REPORT_BODY }));
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.click(await screen.findByRole("button", { name: /Generar reporte/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Exportar a Excel/ }));
    expect(await screen.findByText("Exportación exitosa. El archivo ha sido descargado.")).toBeTruthy();
    expect(calls.some((url) => url.startsWith("/api/admin/reports/export?"))).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("informa el error de exportación en ventana emergente (RF-1.2.15.7.2)", async () => {
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/admin/reports/export")) return new Response(JSON.stringify({ message: "Falló" }), { status: 500 });
      if (url.startsWith("/api/admin/reports")) return new Response(JSON.stringify(REPORT_BODY), { status: 200 });
      if (url.startsWith("/api/admin/clients")) return new Response(JSON.stringify({ data: { clients: [] } }), { status: 200 });
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    fireEvent.change(screen.getByLabelText(/Tipo de reporte/), { target: { value: "REQUESTS" } });
    fireEvent.click(await screen.findByRole("button", { name: /Generar reporte/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Exportar a Excel/ }));
    expect(await screen.findByText("No fue posible exportar el archivo. Intente nuevamente.")).toBeTruthy();
  });
});
