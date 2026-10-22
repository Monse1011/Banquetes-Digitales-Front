import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AdminRequestsTable } from "./admin-requests-table";

const request = {
  request_id: 1,
  folio: "BD-2026-00001",
  client_name: "Cliente",
  client_email: "test@example.invalid",
  requested_date: "2026-10-21T02:30:00Z",
  selected_services: ["Banquetes y bebidas", "Fotografía"],
  status: "Pendiente",
};
it("shows services, local reception date and disables only the pending approval", () => {
  const html = renderToStaticMarkup(
    <AdminRequestsTable
      requests={[request, { ...request, request_id: 2 }]}
      onApprove={vi.fn()}
      approvingIds={[1]}
      approvalErrors={{}}
    />,
  );
  expect(html).toContain("Banquetes y bebidas, Fotografía");
  expect(html).toContain("20 oct 2026");
  expect(html).not.toContain(request.requested_date);
  expect(html).toContain("Aprobando…");
  expect(html.match(/disabled=""/g)).toHaveLength(1);
});
it("keeps the row and retry button visible with an approval error", () => {
  const html = renderToStaticMarkup(
    <AdminRequestsTable
      requests={[request]}
      onApprove={vi.fn()}
      approvingIds={[]}
      approvalErrors={{ 1: "La solicitud ya fue revisada." }}
    />,
  );
  expect(html).toContain('role="alert"');
  expect(html).toContain("La solicitud ya fue revisada.");
  expect(html).toContain("Aprobar");
  expect(html).not.toContain('disabled=""');
  expect(html).toContain(request.folio);
});
