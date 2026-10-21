import { expect, it } from "vitest";
import { confirmationOutcome } from "./confirmation-outcome";
it("keeps incomplete coordination editable and explains how to recover", () => {
  const result = confirmationOutcome("Coordinación Incompleta");
  expect(result.complete).toBe(false);
  expect(result.message).toContain("insuficientes");
  expect(result.message).toContain("vuelve a finalizar");
});
it("offers agreements only after coordination is ready", () => {
  expect(confirmationOutcome("Coordinación Lista").complete).toBe(true);
  expect(confirmationOutcome("Coordinación Lista").message).toContain(
    "acuerdos",
  );
  expect(confirmationOutcome("Asignada").complete).toBe(false);
});
