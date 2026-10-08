"use client";

import { useState } from "react";

import type {
  AssignmentRequestDetail,
  AvailableLogisticsUser,
} from "./assignment-types";

type AssignmentModalProps = {
  request: AssignmentRequestDetail;
  users: AvailableLogisticsUser[];
  onClose: () => void;
  onConfirm: (
    request: AssignmentRequestDetail,
    user: AvailableLogisticsUser,
  ) => void;
  onViewEvents: (user: AvailableLogisticsUser) => void;
};

function formatLongDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatConflictDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

export function AssignmentModal({
  request,
  users,
  onClose,
  onConfirm,
  onViewEvents,
}: AssignmentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  function handleConfirm() {
    if (!selectedUser) {
      return;
    }

    onConfirm(request, selectedUser);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="flex max-h-[90vh] w-full max-w-[512px] flex-col overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            Asignar Responsable de Logística
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-[18px] w-[18px] items-center justify-center text-lg leading-none text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="flex items-center gap-3">
            <p className="text-lg font-semibold text-[#6B2737]">
              {request.folio}
            </p>

            <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
              {request.status}
            </span>
          </div>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase text-[#5A3A3E]">
              Detalle de la solicitud
            </h3>

            <div className="space-y-1.5 text-sm text-[#2C1A1D]">
              <p>
                <span className="font-medium">Cliente: </span>
                {request.client_name}
              </p>

              <p>
                <span className="font-medium">Correo: </span>
                {request.client_email}
              </p>

              <p>
                <span className="font-medium">Teléfono: </span>
                {request.client_phone}
              </p>

              <p>
                <span className="font-medium">Evento: </span>
                {formatLongDate(request.event_date)} · {request.start_time} -{" "}
                {request.end_time}
              </p>

              <p>
                <span className="font-medium">Ubicación: </span>
                {request.event_address}
              </p>

              <p>
                <span className="font-medium">Invitados: </span>
                {request.guest_count} personas
              </p>

              <p>
                <span className="font-medium">Servicios: </span>
                {request.selected_services.join(" ")}
              </p>

              <p className="italic text-[#9A7075]">
                Tipo de evento: {request.event_type ?? "Sin registrar"}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-1">
              <h3 className="text-xs font-semibold uppercase text-[#5A3A3E]">
                Personal de Logística Activo
              </h3>

              <span className="text-xs text-[#C0392B]">*</span>
            </div>

            <div className="space-y-2">
              {users.map((user) => {
                const isUnavailable =
                  user.availability === "No disponible";

                return (
                  <div key={user.id}>
                    <label
                      className={`flex items-center gap-3 rounded-md border border-[#E8D8DB] bg-white p-3 ${
                        isUnavailable
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="logistics-user"
                        value={user.id}
                        checked={selectedUserId === user.id}
                        disabled={isUnavailable}
                        onChange={() => setSelectedUserId(user.id)}
                        className="h-[18px] w-[18px] accent-[#6B2737]"
                      />

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isUnavailable
                              ? "text-[#9A7075]"
                              : "text-[#2C1A1D]"
                          }`}
                        >
                          {user.full_name}
                        </p>

                        <p
                          className={`mt-0.5 text-xs ${
                            isUnavailable
                              ? "text-[#9A7075]"
                              : "text-[#7A5055]"
                          }`}
                        >
                          {user.role}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-0.5">
                        <p
                          className={`text-xs ${
                            isUnavailable
                              ? "text-[#9A7075]"
                              : "text-[#7A5055]"
                          }`}
                        >
                          {user.status}
                        </p>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isUnavailable
                              ? "bg-[#FFF4F2] text-[#C0392B]"
                              : "bg-[#E8F5E9] text-[#2E7D32]"
                          }`}
                        >
                          {user.availability}
                        </span>
                      </div>
                    </label>

                    {isUnavailable && user.conflict && (
                      <div className="space-y-1 py-2 pl-10 text-xs">
                        <p className="text-[#7A5055]">
                          Conflicto: {user.conflict.folio},{" "}
                          {formatConflictDate(user.conflict.event_date)}{" "}
                          {user.conflict.start_time}-
                          {user.conflict.end_time}
                        </p>

                        <button
                          type="button"
                          onClick={() => onViewEvents(user)}
                          className="text-[#6B2737] underline"
                        >
                          Ver sus eventos
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#E8D8DB] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedUser}
            className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar Asignación
          </button>
        </footer>
      </section>
    </div>
  );
}