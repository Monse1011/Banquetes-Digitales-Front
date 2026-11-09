import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { normalizeStatus } from "@/lib/status";
import { StatusTimeline } from "./status-timeline";

const html = (status: string) => renderToStaticMarkup(<StatusTimeline status={status} />);

describe("StatusTimeline", () => {
  it("normaliza la etiqueta en español y el código del contrato al mismo estado", () => {
    expect(normalizeStatus("Confirmado")).toBe(normalizeStatus("CONFIRMED"));
    expect(normalizeStatus("Finalizado")).toBe(normalizeStatus("FINALIZED"));
  });

  it("marca la casilla Finalizado como completa con FINALIZED o Finalizado", () => {
    for (const status of ["FINALIZED", "Finalizado"]) {
      const markup = html(status);
      expect(markup).not.toContain('aria-current="step"');
      expect(markup).not.toMatch(/>6</); // la casilla 6 (Finalizado) muestra ✓, no su número
    }
    expect(html("FINALIZED")).toBe(html("Finalizado"));
  });

  it("deja Finalizado pendiente mientras el evento está Confirmado", () => {
    const markup = html("CONFIRMED");
    expect(markup).toContain('aria-current="step"');
    expect(markup).toMatch(/>6</);
    expect(html("Confirmado")).toBe(markup);
  });
});
