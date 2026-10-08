"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MonthCalendar } from "@/components/logistics/calendar/month-calendar";
import { MOCK_CALENDAR_EVENTS } from "@/components/logistics/calendar/calendar-mocks";

import type { CalendarEvent } from "@/components/logistics/calendar/calendar-types";

import { EditCalendarEventModal } from "@/components/logistics/calendar/edit-calendar-event-modal";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatTime(dateTime: string) {
  return dateTime.slice(11, 16);
}

function getStatusLabel(status: CalendarEvent["status"]) {
  if (status === "CONFIRMED") {
    return "Confirmado";
  }

  if (status === "COMPLETED") {
    return "Finalizado";
  }

  return "Cancelado";
}

export default function LogisticsCalendarPage() {
  const router = useRouter();

  const [eventToEdit, setEventToEdit] =
    useState<CalendarEvent | null>(null);

  const [events, setEvents] =
    useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);

  const [currentMonth, setCurrentMonth] =
    useState(new Date(2026, 9, 1));

  const [selectedDate, setSelectedDate] =
    useState("2026-10-15");

  const [showCancelled, setShowCancelled] =
    useState(false);

  const [message, setMessage] = useState("");

  const selectedEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesDate =
        event.start_datetime.startsWith(selectedDate);

      const visibleByStatus =
        showCancelled ||
        event.status !== "CANCELLED";

      return matchesDate && visibleByStatus;
    });
  }, [events, selectedDate, showCancelled]);

  function handlePreviousMonth() {
    setCurrentMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() - 1);
      return next;
    });
  }

  function handleNextMonth() {
    setCurrentMonth((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + 1);
      return next;
    });
  }

  function handleRetrySync(eventId: number) {
    setEvents((current) =>
      current.map((event) =>
        event.event_id === eventId
          ? {
              ...event,
              sync_status: "SYNCED",
              google_event_id:
                event.google_event_id ??
                `gcal-mock-${event.event_id}`,
            }
          : event,
      ),
    );

    setMessage(
      "Sincronización completada correctamente en modo mock.",
    );
  }

  function handleEdit(event: CalendarEvent) {
    setEventToEdit(event);
    setMessage("");
    }

    function handleSaveEdit(
        eventId: number,
        values: {
            location: string;
            start_datetime: string;
            end_datetime: string;
        },
        ) {
        setEvents((current) =>
            current.map((event) =>
            event.event_id === eventId
                ? {
                    ...event,
                    location: values.location,
                    start_datetime:
                    values.start_datetime,
                    end_datetime:
                    values.end_datetime,
                    sync_status: "PENDING",
                }
                : event,
            ),
        );

        setEventToEdit(null);

        setMessage(
            "Evento actualizado. Pendiente de sincronización en modo mock.",
        );
        }

  function handleCancel(event: CalendarEvent) {
    const confirmed = window.confirm(
      "¿Está seguro de que desea cancelar este evento? Esta acción liberará los recursos asignados.",
    );

    if (!confirmed) {
      return;
    }

    setEvents((current) =>
      current.map((item) =>
        item.event_id === event.event_id
          ? {
              ...item,
              status: "CANCELLED",
            }
          : item,
      ),
    );

    setMessage(
      `${event.folio} fue cancelado en modo mock.`,
    );
  }

  return (
    <main className="p-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
            Calendario de Eventos
          </h1>
        </header>

        {message && (
          <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-4 py-3 text-sm text-[#5A3A3E]">
            {message}
          </div>
        )}

        <MonthCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={events}
          showCancelled={showCancelled}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={setSelectedDate}
          onToggleCancelled={() =>
            setShowCancelled((current) => !current)
          }
        />

        <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <h2 className="font-display text-xl font-semibold capitalize text-[#2C1A1D]">
            Eventos del {formatSelectedDate(selectedDate)}
          </h2>

          {selectedEvents.length === 0 ? (
            <p className="mt-4 text-sm text-[#7A5055]">
              No hay eventos agendados para la fecha seleccionada.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((event) => {
                const isPending =
                  event.sync_status === "PENDING";

                return (
                  <article
                    key={event.event_id}
                    className="flex flex-wrap items-center gap-4 rounded-md bg-[#F5EBE8] p-4"
                  >
                    <div className="min-w-[260px] flex-1">
                      <p className="text-sm font-medium text-[#2C1A1D]">
                        {event.folio} · {event.client_name}
                      </p>

                      <p className="mt-1 text-[13px] text-[#5A3A3E]">
                        {formatTime(event.start_datetime)}
                        {"–"}
                        {formatTime(event.end_datetime)}
                        {" · "}
                        {event.location}
                        {" · "}
                        {event.guest_count} Invitados
                      </p>

                      <p className="mt-1 text-xs text-[#7A5055]">
                        Responsable:{" "}
                        {event.logistics_responsible.full_name}
                      </p>
                    </div>

                    <div className="w-[220px] space-y-2">
                      <div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            event.status === "CANCELLED"
                              ? "bg-[#FDECEC] text-[#C0392B]"
                              : "bg-[#E8F5E9] text-[#2E7D32]"
                          }`}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isPending
                              ? "bg-[#FFF3E0] text-[#E65100]"
                              : "bg-[#E8F5E9] text-[#2E7D32]"
                          }`}
                        >
                          {isPending
                            ? "Pendiente de sincronización"
                            : "Sincronizado"}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-[230px] flex-col items-start gap-2">
                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRetrySync(event.event_id)
                          }
                          className="rounded bg-[#6B2737] px-3 py-2 text-[13px] font-medium text-[#FDF6F0]"
                        >
                          Reintentar sincronización
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/logistics?event=${event.request_numeric_id}`,
                          )
                        }
                        className="text-[13px] font-medium text-[#6B2737]"
                      >
                        Ver ficha
                      </button>

                      {event.status === "CONFIRMED" && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(event)
                            }
                            className="text-[13px] font-medium text-[#6B2737]"
                          >
                            Editar
                          </button>

                          <span className="text-[#9A7075]">
                            |
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(event)
                            }
                            className="text-[13px] font-medium text-[#7A5055]"
                          >
                            Cancelar
                          </button>

                          {eventToEdit && (
                            <EditCalendarEventModal
                                event={eventToEdit}
                                onClose={() => setEventToEdit(null)}
                                onSave={handleSaveEdit}
                            />
                            )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}