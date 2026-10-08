import type {
  AssignedEvent,
  LogisticsEventStatus,
} from "./assigned-event-types";

type Props = {
  events: AssignedEvent[];
  onViewDetail: (event: AssignedEvent) => void;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function AssignedEventsList({
  events,
  onViewDetail,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] p-10 text-center">
        <p className="text-sm text-[#7A5055]">
          No tiene solicitudes de eventos asignadas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => {
        const status = STATUS_CONFIG[event.status];

        return (
          <article
            key={event.id}
            className="flex flex-col gap-3.5 rounded border border-[#E8D8DB] bg-[#FDFAF8] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-[#6B2737]">
                {event.folio}
              </p>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.classes}`}
              >
                {status.label}
              </span>
            </div>

            <p className="text-sm font-medium text-[#2C1A1D]">
              {event.client_name}
            </p>

            <p className="text-sm text-[#5A3A3E]">
              {formatDate(event.event_date)} ·{" "}
              {event.start_time} - {event.end_time} hrs
            </p>

            <p className="text-sm text-[#5A3A3E]">
              {event.location ?? "Sin registrar"}
            </p>

            <button
              type="button"
              onClick={() => onViewDetail(event)}
              className="mt-auto w-fit text-sm font-medium text-[#6B2737]"
            >
              Ver Detalle →
            </button>
          </article>
        );
      })}
    </div>
  );
}