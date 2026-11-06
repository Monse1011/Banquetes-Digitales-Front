import { describe, expect, it } from "vitest";
import { normalizeUser } from "./api/auth";
import { can, navFor } from "./auth/permissions";
import { endsNextDay, formatTime, meridaToIso, parseDateTime, TIME_SLOTS, toMeridaDateTime } from "./format";
import { canConfirmResources, flowStepIndex, normalizeStatus, statusLabel } from "./status";
import { hasLetter, isValidPrice, toReservationPayload, validatePassword, validateReservation, type ReservationForm } from "./validation";

describe("normalizeUser", () => {
  it("unifica camelCase (login) y snake_case (session)", () => {
    const fromLogin = normalizeUser({ id: 1, employeeId: "EMP-0001", fullName: "Juan Pérez", email: "j@x.com", role: "ADMIN" });
    const fromSession = normalizeUser({ id_user: 1, id_employee: "EMP-0001", full_name: "Juan Pérez", email: "j@x.com", role: "ADMIN" });
    expect(fromSession).toEqual(fromLogin);
  });
});

describe("status", () => {
  it("normaliza enum, alias y etiquetas en español", () => {
    expect(normalizeStatus("CANCELLED")).toBe("CANCELED");
    expect(normalizeStatus("Coordinación Lista")).toBe("COORDINATION_READY");
    expect(normalizeStatus("Asignada")).toBe("ASSIGNED");
    expect(normalizeStatus("Propuesta generada")).toBe("PROPOSAL_GENERATED");
    expect(statusLabel("IN_REVIEW")).toBe("En revisión");
  });

  it("habilita acciones según el estado", () => {
    expect(canConfirmResources("Asignada")).toBe(true);
    expect(canConfirmResources("CONFIRMED")).toBe(false);
    expect(flowStepIndex("REJECTED")).toBe(-1);
  });
});

describe("permissions", () => {
  it("separa el menú por rol", () => {
    expect(can("ADMIN", "users.manage")).toBe(true);
    expect(can("LOGISTICS", "users.manage")).toBe(false);
    expect(navFor("LOGISTICS").map((i) => i.href)).toContain("/panel/mis-solicitudes");
    expect(navFor("ADMIN").map((i) => i.href)).not.toContain("/panel/mis-solicitudes");
  });
});

describe("format", () => {
  it("convierte hora de Mérida a ISO UTC", () => {
    expect(meridaToIso("2026-12-24", "18:00")).toBe("2026-12-25T00:00:00.000Z");
  });
  it("interpreta el formato SQL del calendario como hora local", () => {
    expect(parseDateTime("2026-12-24 18:00:00")?.toISOString()).toBe("2026-12-25T00:00:00.000Z");
    expect(formatTime("2026-12-24T18:30:00-06:00")).toBe("18:30");
    expect(toMeridaDateTime("2026-12-24", "18:30")).toBe("2026-12-24T18:30:00-06:00");
    expect(new Date(toMeridaDateTime("2026-12-24", "18:30")).toISOString()).toBe("2026-12-25T00:30:00.000Z");
  });
});

describe("validation", () => {
  const valid: ReservationForm = {
    client_full_name: "Mariana Gómez",
    email: "mariana@gmail.com",
    phone: "9991234567",
    event_date: "2026-12-24",
    start_time: "18:00",
    end_time: "23:00",
    guest_count: "120",
    event_address: "Hacienda San Antonio",
    services_ids: [1],
  };

  it("acepta un formulario válido", () => {
    expect(validateReservation(valid, "2026-10-29")).toEqual({});
  });

  it("marca los mismos campos que el back", () => {
    const errors = validateReservation(
      { ...valid, client_full_name: "Mariana", phone: "123", end_time: "", guest_count: "0", services_ids: [] },
      "2026-10-29",
    );
    expect(Object.keys(errors).sort()).toEqual(["client_full_name", "event_end_time", "guest_count", "phone", "services_ids"]);
  });

  it("calcula el día siguiente cuando horaFin <= horaInicio (sin casilla)", () => {
    const form = { ...valid, end_time: "02:00" };
    expect(validateReservation(form, "2026-10-29")).toEqual({});
    expect(toReservationPayload(form).event_end_time).toBe("2026-12-25T08:00:00.000Z");
    expect(toReservationPayload({ ...valid, end_time: "18:00" }).event_end_time).toBe("2026-12-26T00:00:00.000Z");
    expect(toReservationPayload(valid).event_end_time).toBe("2026-12-25T05:00:00.000Z");
  });

  it("aplica la misma regla de día siguiente que el back", () => {
    expect(endsNextDay("18:00", "02:00")).toBe(true);
    expect(endsNextDay("18:00", "18:00")).toBe(true);
    expect(endsNextDay("18:00", "23:00")).toBe(false);
    expect(endsNextDay("18:00", "")).toBe(false);
    expect(TIME_SLOTS).toHaveLength(48);
    expect(TIME_SLOTS.slice(0, 2)).toEqual(["00:00", "00:30"]);
    expect(TIME_SLOTS.at(-1)).toBe("23:30");
  });

  it("aplica la política de contraseñas", () => {
    expect(validatePassword("abc")).toMatch(/8 caracteres/);
    expect(validatePassword("Password123!")).toBeUndefined();
  });
});

describe("recursos humanos y roles", () => {
  it("exige al menos una letra en el nombre", () => {
    expect(hasLetter("12345")).toBe(false);
    expect(hasLetter("  ")).toBe(false);
    expect(hasLetter("Mesero 2")).toBe(true);
    expect(hasLetter("Ñandú")).toBe(true);
  });

  it("valida el precio por hora: > 0 y máximo 2 decimales", () => {
    expect(isValidPrice("150")).toBe(true);
    expect(isValidPrice("150.75")).toBe(true);
    expect(isValidPrice("0")).toBe(false);
    expect(isValidPrice("0.00")).toBe(false);
    expect(isValidPrice("10.555")).toBe(false);
    expect(isValidPrice("-5")).toBe(false);
    expect(isValidPrice("")).toBe(false);
  });
});
