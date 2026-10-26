"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MonthCalendar } from "@/components/logistics/calendar/month-calendar";
import type { CalendarEvent } from "@/components/logistics/calendar/calendar-types";
import { getCalendarEvents, eventOccupiesDay, editCalendarEvent, cancelCalendarEvent, retryCalendarSync } from "@/lib/api/calendar";
import { agreementError } from "@/lib/api/agreements";
import { useAuth } from "@/lib/auth/auth-context";

import { EditCalendarEventModal } from "@/components/logistics/calendar/edit-calendar-event-modal";

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Merida", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export default function LogisticsCalendarPage() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(`${today()}T12:00:00`));
  const [showCancelled, setShowCancelled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [cancelling, setCancelling] = useState<CalendarEvent | null>(null);
  const [pending, setPending] = useState(false);
  const mutation = useRef(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  function reload() { setLoading(true); setError(""); setRefresh((v) => v + 1); }
  async function retrySync(id: number) {
    if (mutation.current) return;
    mutation.current = true; setPending(true); setNotice(""); setError("");
    try {
      const result = await retryCalendarSync(id);
      const synced = ["Sincronizado", "SYNCED"].includes(result.data.sync_status);
      setNotice(synced ? "Sincronización completada con Google Calendar." : (result.message || "La sincronización sigue pendiente. El backend continuará reintentando."));
      reload();
    } catch (e) { setError(agreementError(e)); }
    finally { mutation.current = false; setPending(false); }
  }
  async function confirmCancellation() {
    if (!cancelling || mutation.current) return;
    mutation.current = true; setPending(true); setActionError("");
    try {
      await cancelCalendarEvent(cancelling.event_id);
      setCancelling(null); setShowCancelled(true);
      setNotice("Evento cancelado. Puedes consultarlo con Mostrar cancelados."); reload();
    } catch (e) { setActionError(agreementError(e)); }
    finally { mutation.current = false; setPending(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    getCalendarEvents(user?.role === "ADMIN", controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setEvents(result);
      const requested = Number(new URLSearchParams(window.location.search).get("request"));
      const target = result.find((event) => event.request_numeric_id === requested);
      if (target) {
        const date = target.start_datetime.slice(0, 10);
        setSelectedDate(date);
        setCurrentMonth(new Date(`${date}T12:00:00`));
      }
    }).catch((e) => {
      if (!controller.signal.aborted) setError(agreementError(e));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [user?.role, refresh]);
  function changeMonth(offset: number) {
    setCurrentMonth((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1));
  }
  const selected = events.filter((event) => eventOccupiesDay(event, selectedDate) && (showCancelled || event.status !== "CANCELLED"));
  return (
    <main className="p-10 text-[#5A3A3E]">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <h1 className="font-display text-3xl text-[#2C1A1D]">Calendario de Eventos</h1>
        <p>Horario de Mérida. {user?.role === "ADMIN" ? "Eventos de todos los responsables." : "Eventos a tu cargo."}</p>
        <button disabled={loading} className="self-start underline disabled:opacity-50" onClick={() => {
          setLoading(true); setError(""); setRefresh((v) => v + 1);
        }}>{loading ? "Cargando eventos…" : "Actualizar calendario"}</button>
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <MonthCalendar currentMonth={currentMonth} selectedDate={selectedDate} events={events}
          showCancelled={showCancelled} onPreviousMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)}
          onSelectDate={setSelectedDate} onToggleCancelled={() => setShowCancelled((v) => !v)} />
        <section className="space-y-4 rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <h2 className="font-display text-xl">Eventos del {new Intl.DateTimeFormat("es-MX", {dateStyle: "long"}).format(new Date(`${selectedDate}T12:00:00`))}</h2>
          {!loading && !error && !selected.length && <p>No hay eventos agendados para esta fecha.</p>}
          {!loading && !error && selected.map((event) => (
            <article key={event.event_id} className="space-y-2 rounded bg-[#F5EBE8] p-4">
              <h3 className="font-semibold">{event.title}</h3>
              <p>{event.start_datetime.replace("T", " ")} — {event.end_datetime.replace("T", " ")}</p>
              <p>{event.location}</p>
              <p>Responsable: {event.logistics_responsible?.full_name ?? "Sin responsable"}</p>
              <p>{{CONFIRMED: "Confirmado", COMPLETED: "Finalizado", CANCELLED: "Cancelado"}[event.status]}</p>
              <p>{event.sync_status === "SYNCED" ? "Sincronizado con Google Calendar" : "Guardado en calendario interno. Pendiente de sincronización con Google Calendar."}</p>
              {event.sync_status === "PENDING" && <button className="underline disabled:opacity-50" disabled={pending} onClick={() => void retrySync(event.event_id)}>{pending ? "Procesando…" : "Reintentar sincronización"}</button>}
              {event.status === "CONFIRMED" && <div className="flex gap-4">
                {user?.role === "LOGISTICS" && Number(user.id_user) === event.logistics_responsible?.user_id && new Date(`${event.start_datetime}-06:00`).getTime() > now &&
                  <button className="underline" onClick={() => { setNotice(""); setEditing(event); }}>Editar evento</button>}
                {(user?.role === "ADMIN" || Number(user?.id_user) === event.logistics_responsible?.user_id) && new Date(`${event.end_datetime}-06:00`).getTime() > now &&
                  <button className="underline" onClick={() => { setNotice(""); setActionError(""); setCancelling(event); }}>Cancelar evento</button>}
              </div>}
              {event.status !== "CANCELLED" && <Link className="underline" href={`/logistics/propuesta/${event.request_numeric_id}`}>Ver propuesta</Link>}
            </article>
          ))}
        </section>
      </section>
      {editing && <EditCalendarEventModal key={editing.event_id} event={editing} onClose={() => setEditing(null)} onSave={async (id, values) => {
        await editCalendarEvent(id, values);
        setEditing(null); setSelectedDate(values.start_datetime.slice(0, 10));
        setCurrentMonth(new Date(`${values.start_datetime.slice(0, 10)}T12:00:00`));
        setNotice("Cambios guardados en el calendario interno."); reload();
      }} />}
      {cancelling && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
        <section role="dialog" aria-modal="true" aria-label="Cancelar evento" className="max-w-lg space-y-4 rounded bg-[#FDFAF8] p-6">
          <h2 className="font-display text-2xl">Cancelar {cancelling.folio}</h2>
          <p>¿Está seguro de que desea cancelar este evento? Esta acción liberará los recursos asignados.</p>
          <p>El evento permanecerá en el historial como cancelado.</p>
          {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
          <div className="flex gap-4">
            <button disabled={pending} onClick={() => setCancelling(null)}>Volver</button>
            <button disabled={pending} className="rounded bg-[#6B2737] px-4 py-2 text-white disabled:opacity-50" onClick={confirmCancellation}>{pending ? "Cancelando…" : "Confirmar cancelación"}</button>
          </div>
        </section>
      </div>}
    </main>
  );
}
