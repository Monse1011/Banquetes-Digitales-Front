"use client";

import { useRouter } from "next/navigation";

import { useMemo, useState } from "react";

import { useLogisticsMock } from "@/lib/logistics/logistics-mock-context";

import { AssignedEventDetailModal } from "@/components/logistics/events/assigned-event-detail-modal";

import { AssignedEventsList } from "@/components/logistics/events/assigned-events-list";

import type {
  AssignedEvent,
  LogisticsEventStatus,
} from "@/components/logistics/events/assigned-event-types";

type ViewMode = "active" | "history";



const ACTIVE_STATUSES: LogisticsEventStatus[] = [
  "ASSIGNED",
  "COORDINATION_READY",
  "COORDINATION_INCOMPLETE",
  "PROPOSAL_GENERATED",
  "CONFIRMED",
];

const HISTORY_STATUSES: LogisticsEventStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

const STATUS_OPTIONS: {
  value: LogisticsEventStatus;
  label: string;
}[] = [
  {
    value: "ASSIGNED",
    label: "Asignada",
  },
  {
    value: "COORDINATION_READY",
    label: "Coordinación Lista",
  },
  {
    value: "COORDINATION_INCOMPLETE",
    label: "Coordinación Incompleta",
  },
  {
    value: "PROPOSAL_GENERATED",
    label: "Propuesta generada",
  },
  {
    value: "CONFIRMED",
    label: "Confirmado",
  },
  {
    value: "COMPLETED",
    label: "Finalizado",
  },
  {
    value: "CANCELLED",
    label: "Cancelado",
  },
];

export default function LogisticsEventsPage() {

  const router = useRouter();

  const { assignedEvents } = useLogisticsMock();
    
  const [viewMode, setViewMode] =
    useState<ViewMode>("active");

  const [statusFilter, setStatusFilter] =
    useState<"all" | LogisticsEventStatus>(
      "all",
    );

  const [selectedEvent, setSelectedEvent] =
    useState<AssignedEvent | null>(null);

  const visibleStatusOptions = useMemo(() => {
    const allowedStatuses =
      viewMode === "active"
        ? ACTIVE_STATUSES
        : HISTORY_STATUSES;

    return STATUS_OPTIONS.filter((option) =>
      allowedStatuses.includes(option.value),
    );
  }, [viewMode]);

  const filteredEvents = useMemo(() => {
    const allowedStatuses =
      viewMode === "active"
        ? ACTIVE_STATUSES
        : HISTORY_STATUSES;

    return assignedEvents.filter(
      (event) => {
        const belongsToCurrentView =
          allowedStatuses.includes(event.status);

        const matchesStatus =
          statusFilter === "all" ||
          event.status === statusFilter;

        return (
          belongsToCurrentView &&
          matchesStatus
        );
      },
    ).sort((a, b) => {
      const aDate = new Date(
        `${a.event_date}T${a.start_time}:00`,
      ).getTime();

      const bDate = new Date(
        `${b.event_date}T${b.start_time}:00`,
      ).getTime();

      if (aDate !== bDate) {
        return aDate - bDate;
      }

      return a.folio.localeCompare(b.folio);
    });
  }, [viewMode, statusFilter]);

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    setStatusFilter("all");
  }

  return (
    <>
      <main className="p-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-6">
          <header>
            <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
              Mis Eventos Asignados
            </h1>

            <p className="mt-1 text-sm text-[#7A5055]">
              Eventos que te han sido asignados
            </p>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  changeView("active")
                }
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium ${
                  viewMode === "active"
                    ? "bg-[#6B2737] text-white"
                    : "border border-[#E8D8DB] text-[#7A5055]"
                }`}
              >
                Activos
              </button>

              <button
                type="button"
                onClick={() =>
                  changeView("history")
                }
                className={`rounded-full px-3.5 py-2 text-[13px] font-medium ${
                  viewMode === "history"
                    ? "bg-[#6B2737] text-white"
                    : "border border-[#E8D8DB] text-[#7A5055]"
                }`}
              >
                Ver historial
              </button>
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | LogisticsEventStatus,
                )
              }
              className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-3.5 py-2 text-[13px] font-medium text-[#5A3A3E]"
            >
              <option value="all">
                Todos los estados
              </option>

              {visibleStatusOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <AssignedEventsList
            events={filteredEvents}
            onViewDetail={setSelectedEvent}
          />
        </section>
      </main>

      {selectedEvent && (
        <AssignedEventDetailModal
          event={selectedEvent}
          onClose={() =>
            setSelectedEvent(null)
          }
          onRegisterAgreements={(event) => {
           router.push(
                `/logistics/acuerdos/${event.id}`,
            );
          }}
          onViewProposal={() => {}}
          onConfirmResources={(event) => {
            router.push(
                `/logistics/recursos/${event.id}`,
            );
            }}
        />
      )}
    </>
  );
}