"use client";

import { useEffect, useRef, useState } from "react";
import { getRequestDetail, listLogisticsUsers, saveAssignment } from "@/lib/api/assignments";
import type { AssignmentRequestDetail, AvailableLogisticsUser } from "./assignments/assignment-types";

type Props = { requestId: number; onClose: () => void; onSaved: () => void };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "No fue posible completar la operación.";

export function RequestDetailModal({ requestId, onClose, onSaved }: Props) {
  const [detail, setDetail] = useState<AssignmentRequestDetail | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState<AvailableLogisticsUser[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const busyRef = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    getRequestDetail(requestId).then((data) => { if (active) setDetail(data); })
      .catch((e) => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestId, revision]);

  useEffect(() => { closeRef.current?.focus(); }, []);

  async function startReassignment() {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(""); setSuccess("");
    try {
      const [current, employees] = await Promise.all([getRequestDetail(requestId), listLogisticsUsers()]);
      setDetail(current);
      if (current.status !== "Asignada") throw new Error("La solicitud no puede ser reasignada en su estado actual.");
      if (!current.logistic_user) throw new Error("El backend no informó el responsable actual. Actualiza la ficha antes de reasignar.");
      setUsers(employees.filter((employee) => employee.id !== current.logistic_user?.id));
      setSelected(""); setEditing(true);
    } catch (e) { setError(errorMessage(e)); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function confirmReassignment() {
    if (busyRef.current || !detail?.logistic_user || detail.status !== "Asignada") return;
    const employee = users.find((entry) => String(entry.id) === selected);
    if (!employee) return;
    if (!window.confirm("¿Desea reasignar la solicitud al nuevo responsable seleccionado?")) return;
    busyRef.current = true; setBusy(true); setError(""); setSuccess("");
    try {
      await saveAssignment(requestId, employee.id, detail.logistic_user.id);
    } catch (e) {
      setError(errorMessage(e));
      // Obliga a recargar responsable y candidatos antes de repetir un intento.
      setEditing(false);
      busyRef.current = false; setBusy(false);
      return;
    }
    setEditing(false); setSelected("");
    setSuccess(`Reasignación registrada a ${employee.full_name}.`);
    onSaved();
    // No seguir mostrando al responsable anterior si falla la lectura posterior.
    setDetail(null);
    try { setDetail(await getRequestDetail(requestId)); }
    catch { setError("La reasignación se guardó, pero no se pudo actualizar la ficha. Pulsa Actualizar ficha."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  function reload() {
    if (busyRef.current) return;
    setError(""); setEditing(false); setDetail(null); setLoading(true); setRevision((v) => v + 1);
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onKeyDown={(event) => {
    if (event.key === "Escape" && !busyRef.current) onClose();
    if (event.key === "Tab") {
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), [href]'));
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <section role="dialog" aria-modal="true" aria-labelledby="request-detail-title" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-xl">
      <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
        <h2 id="request-detail-title" className="font-display text-2xl text-[#2C1A1D]">Ficha de solicitud</h2>
        <button ref={closeRef} type="button" disabled={busy} onClick={onClose} aria-label="Cerrar ficha" className="px-3 py-1 text-xl">×</button>
      </header>
      <div className="space-y-5 overflow-y-auto p-6 text-sm text-[#5A3A3E]">
        {loading && <p role="status">Cargando ficha…</p>}
        {success && <p role="status" className="rounded bg-green-50 p-3 text-green-800">{success}</p>}
        {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>}
        {detail && <>
          <p className="text-lg font-semibold text-[#6B2737]">{detail.folio} · {detail.status}</p>
          <section className="space-y-2"><h3 className="font-semibold">Cliente</h3>
            <p>{detail.client_name || "Sin registrar"}</p><p>{detail.client_email}</p><p>{detail.client_phone}</p>
          </section>
          <section className="space-y-2"><h3 className="font-semibold">Evento</h3>
            <p>Inicio: {detail.event_date} · {detail.start_time}</p>
            <p>Fin: {detail.event_end_date} · {detail.end_time}</p>
            <p>Ubicación: {detail.event_address || "Sin registrar"}</p><p>Invitados: {detail.guest_count}</p>
            <p>Servicios: {detail.selected_services.join(", ") || "Sin registrar"}</p>
          </section>
          <section className="space-y-2"><h3 className="font-semibold">Responsable de logística</h3>
            {detail.logistic_user ? <><p>{detail.logistic_user.full_name}</p><p>ID: {detail.logistic_user.id}</p><p>{detail.logistic_user.email || "Correo sin registrar"}</p></> : <p>{["Pendiente", "Aprobada"].includes(detail.status) ? "Sin asignar" : "Responsable no informado"}</p>}
          </section>
          {detail.status === "Asignada" && !editing && <button type="button" onClick={startReassignment} disabled={busy || !detail.logistic_user} className="rounded border border-[#6B2737] px-4 py-2 text-[#6B2737] disabled:opacity-50">{busy ? "Cargando…" : "Reasignar responsable"}</button>}
          {["Confirmado", "Finalizado", "Cancelado"].includes(detail.status) && <p>La solicitud no puede ser reasignada en su estado actual.</p>}
          {editing && <section className="space-y-3 rounded border border-[#E8D8DB] p-4">
            <label htmlFor="new-responsible" className="block font-semibold">Nuevo responsable</label>
            {users.length === 0 ? <p>No hay otros empleados de Logística activos para reasignar.</p> : <select id="new-responsible" value={selected} disabled={busy} onChange={(e) => setSelected(e.target.value)} className="w-full rounded border bg-white p-2">
              <option value="">Selecciona otro empleado</option>
              {users.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name} · {employee.employee_id}</option>)}
            </select>}
            <p>La disponibilidad del horario se validará al confirmar.</p>
            <div className="flex gap-3"><button type="button" disabled={busy || !selected} onClick={confirmReassignment} className="rounded bg-[#6B2737] px-4 py-2 text-white disabled:opacity-50">{busy ? "Guardando…" : "Confirmar reasignación"}</button>
              <button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancelar</button></div>
          </section>}
        </>}
      </div>
      <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-4">
        <button type="button" onClick={reload} disabled={busy || loading} className="rounded border px-4 py-2 disabled:opacity-50">Actualizar ficha</button>
        <button type="button" onClick={onClose} disabled={busy} className="rounded border px-4 py-2 disabled:opacity-50">Cerrar</button>
      </footer>
    </section>
  </div>;
}
