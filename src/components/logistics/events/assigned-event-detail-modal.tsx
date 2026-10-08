"use client";
import { useRouter } from "next/navigation";

import type {
  AssignedEvent,
  LogisticsEventStatus,
  ResourceType,
} from "./assigned-event-types";

type Props = {
  event: AssignedEvent;
  onClose: () => void;
  onRegisterAgreements: (event: AssignedEvent) => void;
  onViewProposal: (event: AssignedEvent) => void;
  onConfirmResources: (event: AssignedEvent) => void;
};




const STATUS_CONFIG: Record<
  LogisticsEventStatus,
  {
    label: string;
    classes: string;
  }
> = {
  ASSIGNED: {
    label: "Asignada",
    classes: "bg-[#E3F2FD] text-[#1565C0]",
  },
  COORDINATION_READY: {
    label: "Coord. Lista",
    classes: "bg-[#F3E5F5] text-[#6A1B9A]",
  },
  COORDINATION_INCOMPLETE: {
    label: "Coord. Incompleta",
    classes: "bg-[#FFF3E0] text-[#E65100]",
  },
  PROPOSAL_GENERATED: {
    label: "Propuesta generada",
    classes: "bg-[#FFF8E1] text-[#8A6D1D]",
  },
  CONFIRMED: {
    label: "Confirmado",
    classes: "bg-[#E8F5E9] text-[#2E7D32]",
  },
  COMPLETED: {
    label: "Finalizado",
    classes: "bg-[#ECEFF1] text-[#455A64]",
  },
  CANCELLED: {
    label: "Cancelado",
    classes: "bg-[#FDECEC] text-[#C0392B]",
  },
};

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  HUMAN: "Humano",
  MATERIAL: "Material",
  LOGISTIC: "Logístico",
};

function displayValue(
  value: string | number | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Sin registrar";
  }

  return String(value);
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function AssignedEventDetailModal({
  event,
  onClose,
  onRegisterAgreements,
  onViewProposal,
  onConfirmResources,
}: Props) {
  const status = STATUS_CONFIG[event.status];

  const isHistorical =
    event.status === "COMPLETED" ||
    event.status === "CANCELLED";

    const router = useRouter();


  const canRegisterAgreements =
    event.status === "COORDINATION_READY" ||
    event.status === "COORDINATION_INCOMPLETE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            Detalle del Evento
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-lg text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-[#6B2737]">
              {event.folio}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}
            >
              {status.label}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase text-[#5A3A3E]">
                Datos del Cliente
              </h3>

              <div className="space-y-2 text-sm text-[#2C1A1D]">
                <p>
                  <strong>Nombre:</strong>{" "}
                  {displayValue(event.client_name)}
                </p>

                <p>
                  <strong>Correo:</strong>{" "}
                  {displayValue(event.client_email)}
                </p>

                <p>
                  <strong>Teléfono:</strong>{" "}
                  {displayValue(event.client_phone)}
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase text-[#5A3A3E]">
                Detalles del Evento
              </h3>

              <div className="space-y-2 text-sm text-[#2C1A1D]">
                <p>
                  <strong>Fecha:</strong>{" "}
                  {formatLongDate(event.event_date)}
                </p>

                <p>
                  <strong>Hora:</strong>{" "}
                  {event.start_time} - {event.end_time} hrs{" "}
                  <span className="text-[11px] italic text-[#9A7075]">
                    (
                    {event.schedule_status === "PROPOSED"
                      ? "propuesto"
                      : "confirmado"}
                    )
                  </span>
                </p>

                <p>
                  <strong>Ubicación:</strong>{" "}
                  {displayValue(event.location)}
                </p>

                <p>
                  <strong>Número de invitados:</strong>{" "}
                  {displayValue(event.guest_count)}
                </p>
              </div>
            </section>
          </div>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase text-[#5A3A3E]">
              Servicios y recursos requeridos
            </h3>

            {event.services.length === 0 ? (
              <p className="text-sm text-[#7A5055]">
                Sin registrar
              </p>
            ) : (
              <div className="space-y-4">
                {event.services.map((service) => (
                  <div key={service.name}>
                    <p className="mb-1.5 text-sm font-medium text-[#2C1A1D]">
                      {service.name}
                    </p>

                    {service.resources.length === 0 ? (
                      <p className="text-sm text-[#7A5055]">
                        Sin registrar
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {service.resources.map(
                          (resource, index) => (
                            <p
                              key={`${service.name}-${resource.name}-${index}`}
                              className="text-[13px] text-[#5A3A3E]"
                            >
                              •{" "}
                              {RESOURCE_TYPE_LABELS[
                                resource.type
                              ]}{" "}
                              · {resource.name} ·{" "}
                              {resource.quantity}
                            </p>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {!isHistorical && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8D8DB] p-6">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canRegisterAgreements}
                onClick={() => {
                    if (canRegisterAgreements) {
                    onRegisterAgreements(event);
                    }
                }}
                className="rounded border border-[#E8D8DB] px-4 py-2.5 text-sm font-medium text-[#6B2737] disabled:cursor-not-allowed disabled:opacity-40"
                >
                Registrar acuerdos
                </button>

              <button
                type="button"
                onClick={() => onViewProposal(event)}
                className="rounded border border-[#E8D8DB] px-4 py-2.5 text-sm font-medium text-[#6B2737]"
              >
                Ver propuesta
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onConfirmResources(event)
              }
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)]"
            >
              Confirmar recursos
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}