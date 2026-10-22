"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AssignmentModal } from "@/components/admin/assignments/assignment-modal";
import { AssignmentsContent } from "@/components/admin/assignments/assignments-content";
import { AssignmentsFilters } from "@/components/admin/assignments/assignments-filters";
import { getAssignmentRequests, getAssignmentDetail, getEligibleLogisticsUsers, assignRequest, reassignRequest, assignmentError } from "@/lib/api/assignments";
import type {
  AssignmentRequest,
  AssignmentRequestDetail,
  AvailableLogisticsUser,
} from "@/components/admin/assignments/assignment-types";

async function loadRequests() {
  const [approved, assigned] = await Promise.all([getAssignmentRequests(), getAssignmentRequests("ASSIGNED")]);
  return [...approved, ...assigned];
}
export default function AssignmentEventsPage() {
  const [requests, setRequests] = useState<AssignmentRequest[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [modalError, setModalError] = useState("");
  const [detail, setDetail] = useState<AssignmentRequestDetail | null>(null);
  const [users, setUsers] = useState<AvailableLogisticsUser[]>([]);
  async function reload() {
    setLoading(true); setError("");
    try { setRequests(await loadRequests()); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar las solicitudes."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    loadRequests().then((rows) => { if (active) setRequests(rows); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "No se pudieron cargar las solicitudes."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const [view, setView] = useState("Aprobada");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        request.folio.toLowerCase().includes(normalizedSearch) ||
        request.client_name.toLowerCase().includes(normalizedSearch);

      const matchesDate =
        selectedDate.length === 0 ||
        request.event_date === selectedDate;

      return request.status === view && matchesSearch && matchesDate;
    });
  }, [requests, search, selectedDate, view]);

  async function handleAssign(request: AssignmentRequest) {
    if (opening) return;
    setOpening(true); setError(""); setModalError(""); setNotice("");
    try {
      const [requestDetail, eligibleUsers] = await Promise.all([getAssignmentDetail(request.request_id), getEligibleLogisticsUsers()]);
      if (!["Aprobada", "Asignada"].includes(requestDetail.status)) { await reload(); throw new Error("La solicitud cambió de estado. Se actualizó el listado."); }
      if (requestDetail.status === "Asignada" && !requestDetail.logistic_user?.id) throw new Error("No se pudo identificar al responsable actual. Actualiza las solicitudes.");
      setDetail(requestDetail); setUsers(eligibleUsers.filter((u) => Number(u.id) !== Number(requestDetail.logistic_user?.id)));
    } catch(e) { setError(e instanceof Error ? e.message : "No se pudo cargar la asignación."); }
    finally { setOpening(false); }
  }
  function handleCloseModal() { if (!savingRef.current) setDetail(null); }
  async function handleConfirmAssignment(request: AssignmentRequestDetail, user: AvailableLogisticsUser) {
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true); setModalError("");
    try {
      if (request.status === "Asignada") {
        if (!request.logistic_user?.id) throw new Error("Falta el responsable actual. Vuelve a abrir la solicitud.");
        await reassignRequest(request.request_id, user.id, request.logistic_user.id);
      } else {
        await assignRequest(request.request_id, user.id);
      }
      setDetail(null);
      setRequests((current) => current.filter((r) => r.request_id !== request.request_id));
      setNotice(`${request.folio} ${request.status === "Asignada" ? "reasignado" : "asignado"} a ${user.full_name}.`);
      await reload();
    } catch(e) { setModalError(assignmentError(e)); }
    finally { savingRef.current = false; setSaving(false); }
  }

  return (
    <>
      <main className="p-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-6">
          <header>
            <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
              Asignación de Eventos
            </h1>

            <p className="mt-1 text-sm text-[#7A5055]">
              Asigna solicitudes aprobadas o cambia el responsable de las solicitudes asignadas
            </p>
          </header>

          <label className="text-sm text-[#6B2737]">Solicitudes
            <select className="ml-3 rounded border p-2" value={view} onChange={(e) => setView(e.target.value)} disabled={opening || saving}>
              <option value="Aprobada">Aprobadas · Asignar</option>
              <option value="Asignada">Asignadas · Reasignar</option>
            </select>
          </label>
          <AssignmentsFilters
            search={search}
            selectedDate={selectedDate}
            onSearchChange={setSearch}
            onDateChange={setSelectedDate}
          />

          {notice && <p role="status" className="text-green-800">{notice}</p>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          <button type="button" disabled={loading || opening} onClick={() => void reload()} className="self-start text-sm text-[#6B2737] underline">Actualizar solicitudes</button>
          {(loading || opening) && <p role="status">{opening ? "Cargando detalle y responsables…" : "Cargando solicitudes…"}</p>}
          {!loading && !error && <AssignmentsContent
            requests={filteredRequests}
            onAssign={handleAssign}
          />}
        </section>
      </main>

      {detail && (
        <AssignmentModal
          key={detail.request_id}
          request={detail}
          users={users}
          onClose={handleCloseModal}
          onConfirm={handleConfirmAssignment}
          saving={saving}
          error={modalError}
        />
      )}
    </>
  );
}