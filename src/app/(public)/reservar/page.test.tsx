import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReservationPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Zona del "navegador" distinta a Mérida: "hoy" y "ahora" deben salir de America/Merida, no de aquí.
const ORIGINAL_TZ = process.env.TZ;

beforeEach(() => {
  process.env.TZ = "Asia/Tokyo";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ data: { services: [{ id: 1, name: "Banquete", description: "Menú", price: 100 }] } }), { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  process.env.TZ = ORIGINAL_TZ;
});

const startSelect = () => screen.getByLabelText(/Hora de inicio/) as HTMLSelectElement;
const disabledSlots = () => Array.from(startSelect().options).filter((o) => o.value && o.disabled).map((o) => o.value);
const setDate = (value: string) => fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value } });

describe("Reservar: selector de fecha y hora", () => {
  it("a las 23:30 de Mérida deshabilita todas las horas de hoy y ninguna de mañana", () => {
    vi.setSystemTime(new Date("2026-11-06T05:30:00Z")); // 2026-11-05 23:30 en Mérida (Tokio: 14:30 del 6)
    render(<ReservationPage />);
    setDate("2026-11-05");
    expect(disabledSlots()).toHaveLength(48);
    setDate("2026-11-06");
    expect(disabledSlots()).toEqual([]);
  });

  it("a las 00:30 de Mérida solo deshabilita 00:00 y 00:30", () => {
    vi.setSystemTime(new Date("2026-11-06T06:30:00Z")); // 2026-11-06 00:30 en Mérida
    render(<ReservationPage />);
    setDate("2026-11-06");
    expect(disabledSlots()).toEqual(["00:00", "00:30"]);
    expect(Array.from(startSelect().options).find((o) => o.value === "01:00")?.disabled).toBe(false);
  });

  it("muestra «Termina el día siguiente» solo cuando horaFin <= horaInicio", () => {
    vi.setSystemTime(new Date("2026-11-06T06:30:00Z"));
    render(<ReservationPage />);
    setDate("2026-12-24");
    fireEvent.change(startSelect(), { target: { value: "20:00" } });
    const end = screen.getByLabelText(/Hora de término/);

    fireEvent.change(end, { target: { value: "23:00" } });
    expect(screen.queryByText(/Termina el día siguiente/)).toBeNull();

    fireEvent.change(end, { target: { value: "02:00" } });
    expect(screen.getByText("Termina el día siguiente (25/12)")).toBeTruthy();

    fireEvent.change(end, { target: { value: "20:00" } });
    expect(screen.getByText("Termina el día siguiente (25/12)")).toBeTruthy();
  });
});
