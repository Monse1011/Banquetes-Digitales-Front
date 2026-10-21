"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AssignmentModal } from "@/components/admin/assignments/assignment-modal";
import { AssignmentsContent } from "@/components/admin/assignments/assignments-content";
import { AssignmentsFilters } from "@/components/admin/assignments/assignments-filters";
import type { AssignmentRequest, AssignmentRequestDetail, AvailableLogisticsUser } from "@/components/admin/assignments/assignment-types";
import { listApprovedRequests, getAssignmentDetail, listLogisticsUsers, saveAssignment } from "@/lib/api/assignments";

export default function AssignmentEventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AssignmentRequest[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [detail, setDetail] = useState<AssignmentRequestDetail | null>(null);
  const [users, setUsers] = useState<AvailableLogisticsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [refresh, setRefresh] = useState(0);
  const savingRef = useRef(false);
  const openingRef = useRef(false);
  const authorized = user?.role === "admin";

  useEffect(() => {
    if (!authorized) { router.replace("/login"); return; }
    const controller = new AbortController();
    listApprovedRequests(controller.signal).then(setRequests).catch((e) => {
      if (!controller.signal.aborted) setError(e.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authorized, router, refresh]);

  const filtered = useMemo(() => requests.filter((request) => {
    const term = search.trim().toLowerCase();
    return (!term || request.folio.toLowerCase().includes(term) || request.client_name.toLowerCase().includes(term))
      && (!selectedDate || request.event_date === selectedDate);
  }), [requests, search, selectedDate]);

  function reload() { setError(""); setLoading(true); setRefresh((v) => v + 1); }

  async function open(request: AssignmentRequest) {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true); setError(""); setSuccess(""); setModalError("");
    try {
      const [loadedDetail, loadedUsers] = await Promise.all([getAssignmentDetail(request), listLogisticsUsers()]);
      setUsers(loadedUsers); setDetail(loadedDetail);
    } catch (e) { setError(e instanceof Error ? e.message : "No fue posible cargar el detalle."); }
    finally { openingRef.current = false; setOpening(false); }
  }

  async function confirm(request: AssignmentRequestDetail, employee: AvailableLogisticsUser) {
    if (savingRef.current) return;
    if (!window.confirm("¿Desea confirmar la asignación del responsable seleccionado?")) return;
    savingRef.current = true; setSaving(true); setModalError("");
    try {
      await saveAssignment(request.request_id, employee.id);
      setDetail(null);
      setRequests((rows) => rows.filter((row) => row.request_id !== request.request_id));
      setSuccess(`Solicitud ${request.folio} asignada a ${employee.full_name}.`);
      reload();
    } catch (e) { setModalError(e instanceof Error ? e.message : "No se pudo registrar la asignación."); }
    finally { savingRef.current = false; setSaving(false); }
  }

  if (!authorized) return null;
  return <main className="p-10">
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <header><h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">Asignación de Eventos</h1>
      <p className="mt-1 text-sm text-[#7A5055]">Asigna personal de logística a las solicitudes aprobadas.</p></header>
      <AssignmentsFilters search={search} selectedDate={selectedDate} onSearchChange={setSearch} onDateChange={setSelectedDate} />
      <button type="button" onClick={reload} disabled={loading || saving || opening} className="self-start rounded border px-4 py-2 disabled:opacity-50">Actualizar solicitudes</button>
      {success && <p role="status" className="text-green-800">{success}</p>}
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800">{error}</p>}
      {opening && <p role="status">Cargando solicitud y empleados…</p>}
      {loading ? <p role="status">Cargando solicitudes…</p> : !error && <AssignmentsContent requests={filtered} onAssign={open} />}
    </section>
    {detail && <AssignmentModal request={detail} users={users} onClose={() => { if (!savingRef.current) setDetail(null); }} onConfirm={confirm} saving={saving} error={modalError} />}
  </main>;
}
