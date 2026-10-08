"use client";

import { useState } from "react";

import type { CalendarEvent } from "./calendar-types";

type Props = {
  event: CalendarEvent;
  onClose: () => void;
  onSave: (
    eventId: number,
    values: {
      location: string;
      start_datetime: string;
      end_datetime: string;
    },
  ) => void;
};

function toDateInput(dateTime: string) {
  return dateTime.slice(0, 10);
}

function toTimeInput(dateTime: string) {
  return dateTime.slice(11, 16);
}

export function EditCalendarEventModal({
  event,
  onClose,
  onSave,
}: Props) {
  const [location, setLocation] =
    useState(event.location);

  const [startDate, setStartDate] =
    useState(toDateInput(event.start_datetime));

  const [startTime, setStartTime] =
    useState(toTimeInput(event.start_datetime));

  const [endDate, setEndDate] =
    useState(toDateInput(event.end_datetime));

  const [endTime, setEndTime] =
    useState(toTimeInput(event.end_datetime));

  const [error, setError] = useState("");

  function handleSave() {
    setError("");

    if (!location.trim()) {
      setError("El campo ubicación es obligatorio.");
      return;
    }

    if (!startDate) {
      setError(
        "El campo fecha de inicio es obligatorio.",
      );
      return;
    }

    if (!startTime) {
      setError(
        "El campo hora de inicio es obligatorio.",
      );
      return;
    }

    if (!endDate) {
      setError(
        "El campo fecha de fin es obligatorio.",
      );
      return;
    }

    if (!endTime) {
      setError(
        "El campo hora de fin es obligatorio.",
      );
      return;
    }

    const start = new Date(
      `${startDate}T${startTime}:00`,
    );

    const end = new Date(
      `${endDate}T${endTime}:00`,
    );

    if (end <= start) {
      setError(
        "La hora de fin debe ser posterior a la de inicio.",
      );
      return;
    }

    onSave(event.event_id, {
      location: location.trim(),
      start_datetime: `${startDate}T${startTime}:00`,
      end_datetime: `${endDate}T${endTime}:00`,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[620px] rounded-lg border border-[#E8D8DB] bg-[#FDFAF8]">
        <header className="flex items-start justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Editar evento
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              {event.folio} · {event.client_name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-lg text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="space-y-5 p-6">
          <div className="rounded border border-[#E8D8DB] bg-[#F5EBE8] px-4 py-3">
            <p className="text-sm text-[#5A3A3E]">
              Responsable de logística
            </p>

            <p className="mt-1 text-sm font-medium text-[#2C1A1D]">
              {
                event.logistics_responsible
                  .full_name
              }
            </p>

            <p className="mt-1 text-xs text-[#9A7075]">
              El responsable no puede modificarse.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[#7A5055]">
              Ubicación
            </label>

            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              className="mt-2 w-full rounded border border-[#D4BFC2] bg-white px-3 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#7A5055]">
                Fecha de inicio
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="mt-2 w-full rounded border border-[#D4BFC2] bg-white px-3 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#7A5055]">
                Hora de inicio
              </label>

              <input
                type="time"
                value={startTime}
                onChange={(event) =>
                  setStartTime(event.target.value)
                }
                className="mt-2 w-full rounded border border-[#D4BFC2] bg-white px-3 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#7A5055]">
                Fecha de fin
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="mt-2 w-full rounded border border-[#D4BFC2] bg-white px-3 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-[#7A5055]">
                Hora de fin
              </label>

              <input
                type="time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                className="mt-2 w-full rounded border border-[#D4BFC2] bg-white px-3 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded border border-[#F3C2C2] bg-[#FDECEC] px-4 py-3 text-sm text-[#C0392B]">
              {error}
            </div>
          )}

          <div className="rounded border border-[#F2D7B6] bg-[#FFF3E0] px-4 py-3">
            <p className="text-xs text-[#E65100]">
              Si cambia la fecha o la hora, la
              disponibilidad del responsable y los
              recursos debe reevaluarse antes de guardar.
            </p>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0]"
          >
            Guardar cambios
          </button>
        </footer>
      </section>
    </div>
  );
}