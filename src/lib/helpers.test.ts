import { describe, expect, it } from "vitest";
import { defaultUsageWindow } from "./api/logistics";
import { addDays, formatMoney, monthGrid, toInputParts } from "./format";
import { clientStatusLabel, FLOW_STEPS, flowStepIndex } from "./status";

const meta = (start_time: string, end_time: string) => ({
  request_id: 1,
  folio: "BD-2026-00001",
  status: "Asignada",
  event_date: "2026-12-31",
  start_time,
  end_time,
  observations: null,
  pending_observations: null,
});

describe("monthGrid", () => {
  it("empieza en lunes y cubre seis semanas", () => {
    const days = monthGrid(2026, 9); // octubre 2026: el 1 es jueves
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-09-28");
    expect(days[3]).toBe("2026-10-01");
    expect(days[41]).toBe("2026-11-08");
  });

  it("cruza el cambio de año", () => {
    const days = monthGrid(2027, 0);
    expect(days).toContain("2027-01-31");
    expect(days[0] < "2027-01-01").toBe(true);
  });
});

describe("defaultUsageWindow", () => {
  it("usa el horario del evento", () => {
    expect(defaultUsageWindow(meta("18:00", "23:00"))).toEqual({
      usage_start: "2026-12-31 18:00:00",
      usage_end: "2026-12-31 23:00:00",
    });
  });

  it("pasa al día siguiente si termina después de medianoche", () => {
    expect(defaultUsageWindow(meta("20:00", "02:00")).usage_end).toBe("2027-01-01 02:00:00");
  });
});

describe("format", () => {
  it("suma días entre meses", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("separa fecha y hora locales de valores ISO y SQL", () => {
    expect(toInputParts("2026-12-25T00:30:00.000Z")).toEqual({ date: "2026-12-24", time: "18:30" });
    expect(toInputParts("2026-12-24 18:30:00")).toEqual({ date: "2026-12-24", time: "18:30" });
    expect(toInputParts(null)).toEqual({ date: "", time: "" });
  });

  it("formatea pesos mexicanos", () => {
    expect(formatMoney(1900)).toMatch(/\$1,900\.00/);
  });
});

describe("status para el cliente", () => {
  it("agrupa los estados internos en pasos legibles", () => {
    expect(clientStatusLabel("COORDINATION_INCOMPLETE")).toBe("En planeación");
    expect(FLOW_STEPS[flowStepIndex("ADJUSTMENTS_REQUESTED")].key).toBe("proposal");
    expect(flowStepIndex("Finalizado")).toBe(FLOW_STEPS.length - 1);
  });
});
