import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart, LineChart, PieChart } from "./charts";

const BUCKETS = [
  { label: "2026-10-01", count: 0 },
  { label: "2026-10-02", count: 3 },
  { label: "2026-10-03", count: 1 },
];

describe("gráficas de reportes", () => {
  it("barras: una por intervalo con ejes etiquetados", () => {
    const { container } = render(<BarChart data={BUCKETS} xLabel="Día" yLabel="Solicitudes" />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    expect(screen.getByRole("img", { name: "Gráfica de barras: Solicitudes por Día" })).toBeTruthy();
    expect(screen.getByText("Día")).toBeTruthy();
    expect(screen.getByText("Solicitudes")).toBeTruthy();
  });

  it("líneas: un punto por intervalo", () => {
    const { container } = render(<LineChart data={BUCKETS} xLabel="Mes" yLabel="Eventos" />);
    expect(container.querySelectorAll("circle")).toHaveLength(3);
    expect(container.querySelector("polyline")).toBeTruthy();
  });

  it("pastel: un segmento y su porcentaje en la leyenda", () => {
    const data = [
      { label: "Banquetes", count: 3, percentage: 75 },
      { label: "Bebidas", count: 1, percentage: 25 },
    ];
    const { container } = render(<PieChart data={data} />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(screen.getByText("Banquetes")).toBeTruthy();
    expect(screen.getByText("75.00%")).toBeTruthy();
    expect(screen.getByText("25.00%")).toBeTruthy();
  });
});
