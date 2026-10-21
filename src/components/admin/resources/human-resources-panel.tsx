"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getHumanResource, listHumanResources, listOperativeRoles, ResourceApiError, saveHumanResource, setHumanResourceActive, type HumanResourceRecord } from "@/lib/api/human-resources";
import { HumanResourceFormModal } from "./human-resource-form-modal";
import { HumanResourcesTable } from "./human-resources-table";
import { HumanResourcesFilters } from "./human-resources-filters";
import type { HumanResource, HumanResourceFormValues, OperativeRoleOption } from "./resource-types";

const button = "rounded border border-[#D4BFC2] px-4 py-2 text-sm text-[#6B2737] disabled:opacity-50";
const message = (error: unknown) => error instanceof Error ? error.message : "No fue posible completar la operación.";
const date = (value?: string) => !value ? "Sin registrar" : Number.isNaN(new Date(value).getTime()) ? value : new Date(value).toLocaleString("es-MX");

export function HumanResourcesPanel() {
  const { user } = useAuth();
  const [records, setRecords] = useState<HumanResourceRecord[]>([]);
  const [roles, setRoles] = useState<OperativeRoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [form, setForm] = useState<{id?: number; values?: HumanResourceFormValues} | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const [detail, setDetail] = useState<HumanResourceRecord | null>(null);

  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError("");
    try {
      const [activeRoles, groups] = await Promise.all([
        listOperativeRoles(),
        Promise.all(status === "all" ? [listHumanResources("active"), listHumanResources("inactive")] : [listHumanResources(status)]),
      ]);
      if (current !== generation.current) return;
      setRoles(activeRoles); setRecords(groups.flat());
    } catch (e) { if (current === generation.current) { setRecords([]); setError(message(e)); } }
    finally { if (current === generation.current) setLoading(false); }
  }, [status]);
  useEffect(() => {
    const requests = generation;
    // The remote status filter needs a loading state while its request is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.role === "admin") void load();
    return () => { requests.current++; };
  }, [load, user?.role]);

  const rows = useMemo<HumanResource[]>(() => records
    .filter(r => r.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!roleId || r.operative_role_id === Number(roleId)))
    .sort((a,b) => a.name.localeCompare(b.name, "es"))
    .map(r => ({ ...r, identifier: String(r.id), operative_role: roles.find(role => role.id === r.operative_role_id) ?? {id: r.operative_role_id, name: `Rol ${r.operative_role_id} (fuera del catálogo activo)`}, assigned_to_event: null })), [records, roles, search, roleId]);

  async function inspect(resource: HumanResource, edit = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setSuccess("");
    try {
      const fresh = await getHumanResource(resource.id);
      if (edit) { setFormError(""); setForm({ id: fresh.id, values: {name: fresh.name, operative_role_id: fresh.operative_role_id} }); }
      else setDetail(fresh);
    } catch (e) { setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(values: HumanResourceFormValues) {
    if (lock.current || !form) return;
    lock.current = true; setBusy(true); setFormError(""); setSuccess("");
    try {
      try { await saveHumanResource(values, form.id); }
      catch (e) {
        if (form.id === undefined && e instanceof ResourceApiError && e.requiresConfirmation) {
          if (!window.confirm(`${e.message}\n¿Desea registrar el recurso de todas formas?`)) return;
          await saveHumanResource(values, undefined, true);
        } else throw e;
      }
      setForm(null); setSuccess("Recurso humano guardado correctamente."); await load();
    } catch (e) { setFormError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function changeStatus(resource: HumanResource) {
    if (lock.current || !window.confirm(`¿Desea ${resource.is_active ? "desactivar" : "reactivar"} a ${resource.name}?`)) return;
    lock.current = true; setBusy(true); setError(""); setSuccess("");
    try { await setHumanResourceActive(resource.id, !resource.is_active); setSuccess("Estado actualizado correctamente."); await load(); }
    catch (e) { setError(message(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  if (user?.role !== "admin") return <p role="alert">Se requiere una sesión de Administrador General para consultar recursos humanos.</p>;
  return <>
    <div className="flex flex-wrap items-center gap-3">
      <button className={button} disabled={loading || busy || !!error || !roles.length} onClick={() => { setFormError(""); setForm({}); setSuccess(""); }}>+ Agregar recurso humano</button>
      <button className={button} disabled={loading || busy} onClick={() => void load()}>Actualizar</button>
      <HumanResourcesFilters search={search} status={status} roleId={roleId} operativeRoles={roles} onSearchChange={setSearch} onStatusChange={setStatus} onRoleChange={setRoleId} />
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {success && <p role="status" className="text-green-800">{success}</p>}
    {!loading && !error && !roles.length && <p>No hay roles operativos activos. Es necesario registrar un rol antes de dar de alta recursos humanos.</p>}
    {loading ? <p role="status">Cargando recursos humanos…</p> : !error && <div aria-busy={busy}><HumanResourcesTable resources={rows} onViewDetail={r => void inspect(r)} onEdit={r => void inspect(r, true)} onChangeStatus={r => void changeStatus(r)} /></div>}
    {form && <HumanResourceFormModal mode={form.id === undefined ? "create" : "edit"} operativeRoles={roles} initialValues={form.values} saving={busy} error={formError} onClose={() => { if (!busy) setForm(null); }} onSubmit={values => void save(values)} />}
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="rh-detail-title" className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-auto rounded-lg bg-[#FDFAF8] p-6 text-[#5A3A3E]">
      <h2 id="rh-detail-title" className="font-display text-2xl">Detalle del recurso humano</h2>
      <p>Identificador: {detail.id}</p><p>Tipo: Humano</p><p>Nombre: {detail.name}</p>
      <p>Rol operativo: {roles.find(r => r.id === detail.operative_role_id)?.name ?? `Rol ${detail.operative_role_id} (fuera del catálogo activo)`}</p>
      <p>Estado: {detail.is_active ? "Activo" : "Inactivo"}</p><p>Fecha de registro: {date(detail.created_at)}</p><p>Última modificación: {date(detail.updated_at)}</p>
      <p>Eventos en curso o futuros: información no disponible.</p>
      <button className={button} onClick={() => setDetail(null)}>Cerrar</button>
    </section></div>}
  </>;
}
