import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { OperativeRoleFormModal } from "./operative-role-form-modal";
import { OperativeRolesTable } from "./operative-roles-table";

function form(name: string, busy = false, error = "") {
  return renderToStaticMarkup(<OperativeRoleFormModal mode="edit" initialValues={{name}}
    busy={busy} error={error} onClose={vi.fn()} onSubmit={vi.fn()} />);
}
it("allows the 100-character backend limit rather than the old 50-character limit", () => {
  const html = form("A".repeat(100));
  expect(html).toContain('maxLength="100"');
  expect(html).not.toMatch(/<button[^>]*type="submit"[^>]* disabled=""/);
  expect(form("A".repeat(101))).toMatch(/<button[^>]*type="submit"[^>]* disabled=""/);
  expect(form("   ")).toMatch(/<button[^>]*type="submit"[^>]* disabled=""/);
});
it("keeps the typed name visible with the server error so it can be corrected", () => {
  const html = form("Chef",false,"Ya existe un rol operativo con ese nombre.");
  expect(html).toContain('value="Chef"');
  expect(html).toContain('role="alert"');
  expect(html).toContain("Ya existe un rol operativo con ese nombre.");
});
it("prevents resubmission and dismissal while saving", () => {
  const html = form("Chef",true);
  expect(html).toContain("Guardando…");
  expect(html).toMatch(/<input[^>]* disabled=""/);
  const buttons = html.match(/<button\b[^>]*>/g) ?? [];
  expect(buttons).toHaveLength(3);
  expect(buttons.every(button => button.includes(' disabled=""'))).toBe(true);
});
it("offers only supported mutations and blocks row actions while busy", () => {
  const html = renderToStaticMarkup(<OperativeRolesTable roles={[
    {id:1,name:"Chef",is_active:true,active_human_resources_count:2},
  ]} onEdit={vi.fn()} onDeactivate={vi.fn()} busy />);
  expect(html).toContain("Editar");
  expect(html).toContain("Desactivar");
  expect(html).not.toContain("Reactivar");
  expect((html.match(/<button\b[^>]*>/g) ?? []).every(button => button.includes(' disabled=""'))).toBe(true);
});
