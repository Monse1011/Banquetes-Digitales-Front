import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AdminRequestsPagination } from "./admin-requests-pagination";
import { AdminRequestsContent } from "./admin-requests-content";

function renderPagination(overrides = {}) {
  return renderToStaticMarkup(
    <AdminRequestsPagination
      page={1} perPage={10} totalRecords={11} visibleRecords={10}
      disabled={false} showRange
      onPageChange={vi.fn()} onPerPageChange={vi.fn()}
      {...overrides}
    />,
  );
}

function isDisabled(html: string, label: string) {
  const match = html.match(new RegExp(`<button\\b([^>]*)>${label}</button>`));
  expect(match).not.toBeNull();
  return match![1].includes('disabled=""');
}

it("keeps the eleventh record reachable and prevents going before page one", () => {
  const html = renderPagination();
  expect(html).toContain("Mostrando 1–10 de 11 solicitudes.");
  expect(html).toContain("Página 1 de 2");
  expect(isDisabled(html, "Anterior")).toBe(true);
  expect(isDisabled(html, "Primera")).toBe(true);
  expect(isDisabled(html, "Siguiente")).toBe(false);
  expect(isDisabled(html, "Última")).toBe(false);
});

it("shows the partial last page without offering an empty next page", () => {
  const html = renderPagination({ page: 2, visibleRecords: 1 });
  expect(html).toContain("Mostrando 11–11 de 11 solicitudes.");
  expect(html).toContain("Página 2 de 2");
  expect(isDisabled(html, "Anterior")).toBe(false);
  expect(isDisabled(html, "Siguiente")).toBe(true);
});

it("handles an empty result without negative ranges or page zero", () => {
  const html = renderPagination({ totalRecords: 0, visibleRecords: 0 });
  expect(html).toContain("Mostrando 0–0 de 0 solicitudes.");
  expect(html).toContain("Página 1 de 1");
  expect(isDisabled(html, "Anterior")).toBe(true);
  expect(isDisabled(html, "Siguiente")).toBe(true);
});

it("disables navigation during requests or approvals and hides stale ranges while loading", () => {
  const html = renderPagination({ disabled: true, showRange: false });
  expect(html).not.toContain("Mostrando");
  for (const label of ["Primera", "Anterior", "Siguiente", "Última"]) {
    expect(isDisabled(html, label)).toBe(true);
  }
  expect(html).toMatch(/<select[^>]*disabled=""/);
});

it("offers retry after a page failure instead of claiming that there are no requests", () => {
  const html = renderToStaticMarkup(
    <AdminRequestsContent isLoading={false} error="No se pudo cargar la página."
      requests={[]} approvingIds={[]} approvalErrors={{}}
      onApprove={vi.fn()} onRetry={vi.fn()} />,
  );
  expect(html).toContain('role="alert"');
  expect(html).toContain("Reintentar carga");
  expect(html).not.toContain("No hay solicitudes registradas");
});
