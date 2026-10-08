"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useLogisticsMock } from "@/lib/logistics/logistics-mock-context";
import { ResourceConfirmationTable } from "@/components/logistics/resource-confirmation/resource-confirmation-table";
import { HumanAssignmentModal } from "@/components/logistics/resource-confirmation/human-assignment-modal";

import type {
  ConfirmationResource,
  ResourceConfirmationEvent,
} from "@/components/logistics/resource-confirmation/resource-confirmation-types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function updateObservation(
  resources: ConfirmationResource[],
  resourceId: number,
  observation: string,
) {
  return resources.map((resource) =>
    resource.id === resourceId
      ? {
          ...resource,
          observation,
        }
      : resource,
  );
}

function assignResource(
  resources: ConfirmationResource[],
  resourceId: number,
) {
  return resources.map((resource) =>
    resource.id === resourceId
      ? {
          ...resource,
          is_assigned: true,
          assigned_quantity: resource.requested_quantity,
        }
      : resource,
  );
}

export default function ResourceConfirmationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
  resourceConfirmations,
  setResourceConfirmations,
  setAssignedEvents,
} = useLogisticsMock();


  const eventId = Number(params.id);

  const initialEvent =
    resourceConfirmations.find(
        (event) => event.id === eventId,
    );

  const [event, setEvent] =
    useState<ResourceConfirmationEvent | null>(
      initialEvent ?? null,
    );

    const [humanResourceToAssign, setHumanResourceToAssign] =
        useState<ConfirmationResource | null>(null);

  const [message, setMessage] = useState("");

  if (!event) {
    return (
      <main className="p-10">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-8 text-center">
            <h1 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Evento no encontrado
            </h1>

            <p className="mt-2 text-sm text-[#7A5055]">
              No fue posible encontrar la solicitud seleccionada.
            </p>

            <button
              type="button"
              onClick={() => router.push("/logistics")}
              className="mt-5 rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0]"
            >
              Volver a Mis Eventos
            </button>
          </div>
        </section>
      </main>
    );
  }

  function handleAssign(resource: ConfirmationResource) {
    if (!event) {
      return;
    }

    if (resource.type === "HUMAN") {
        setHumanResourceToAssign(resource);
        setMessage("");
        return;
    }

    if (resource.type === "MATERIAL") {
      setEvent({
        ...event,
        material_resources: assignResource(
          event.material_resources,
          resource.id,
        ),
      });
    }

    if (resource.type === "LOGISTIC") {
      setEvent({
        ...event,
        logistic_resources: assignResource(
          event.logistic_resources,
          resource.id,
        ),
      });
    }

    setMessage(
      `${resource.name} fue asignado provisionalmente.`,
    );
  }

  function handleObservationChange(
    type: "HUMAN" | "MATERIAL" | "LOGISTIC",
    resourceId: number,
    observation: string,
  ) {
    if (!event) {
      return;
    }

    if (type === "HUMAN") {
      setEvent({
        ...event,
        human_resources: updateObservation(
          event.human_resources,
          resourceId,
          observation,
        ),
      });
    }

    if (type === "MATERIAL") {
      setEvent({
        ...event,
        material_resources: updateObservation(
          event.material_resources,
          resourceId,
          observation,
        ),
      });
    }

    if (type === "LOGISTIC") {
      setEvent({
        ...event,
        logistic_resources: updateObservation(
          event.logistic_resources,
          resourceId,
          observation,
        ),
      });
    }
  }

  function handleCancel() {
    router.push("/logistics");
  }

  function handleFinishConfirmation() {
    if (!event) {
      return;
    }

    const allResources = [
      ...event.human_resources,
      ...event.material_resources,
      ...event.logistic_resources,
    ];

    const sufficientWithoutAssignment =
      allResources.find(
        (resource) =>
          resource.sufficiency === "SUFFICIENT" &&
          !resource.is_assigned,
      );

    if (sufficientWithoutAssignment) {
      setMessage(
        "Debe asignar todos los recursos con estado Suficiente antes de finalizar la confirmación.",
      );
      return;
    }

    const hasInsufficientResource =
      allResources.some(
        (resource) =>
          resource.sufficiency === "INSUFFICIENT",
      );

    setEvent({
      ...event,
      status: hasInsufficientResource
        ? "COORDINATION_INCOMPLETE"
        : "COORDINATION_READY",
    });

    setResourceConfirmations((current) =>
        current.map((item) =>
            item.id === event.id
            ? {
                ...item,
                status: hasInsufficientResource
                    ? "COORDINATION_INCOMPLETE"
                    : "COORDINATION_READY",
                }
            : item,
        ),
        );

        setAssignedEvents((current) =>
        current.map((item) =>
            item.id === event.id
            ? {
                ...item,
                status: hasInsufficientResource
                    ? "COORDINATION_INCOMPLETE"
                    : "COORDINATION_READY",
                }
            : item,
        ),
        );

    setMessage(
      hasInsufficientResource
        ? "Confirmación finalizada. La solicitud quedó en Coordinación Incompleta."
        : "Confirmación finalizada. La solicitud quedó en Coordinación Lista.",
    );
  }

  return (
    <main className="p-10 pb-28">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
            Confirmación de Recursos
          </h1>

          <p className="mt-1 text-sm text-[#7A5055]">
            {event.folio} - {event.client_name}
          </p>
        </header>

        {message && (
          <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-4 py-3 text-sm text-[#5A3A3E]">
            {message}
          </div>
        )}

        <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <h2 className="font-display text-lg font-semibold text-[#6B2737]">
            Resumen del Evento
          </h2>

          <div className="mt-4 grid gap-6 md:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Cliente
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {event.client_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Fecha
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {formatDate(event.event_date)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Hora
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {event.start_time} - {event.end_time}
                <span className="ml-1 text-[13px] italic text-[#9A7075]">
                  (
                  {event.schedule_status === "PROPOSED"
                    ? "propuesto"
                    : "confirmado"}
                  )
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Invitados
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {event.guest_count} personas
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Servicios
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {event.services.join(" · ")}
              </p>
            </div>
          </div>
        </section>

        <ResourceConfirmationTable
          step="01"
          title="Recursos Humanos"
          resources={event.human_resources}
          onAssign={handleAssign}
          onObservationChange={(
            resourceId,
            observation,
          ) =>
            handleObservationChange(
              "HUMAN",
              resourceId,
              observation,
            )
          }
        />

        <ResourceConfirmationTable
          step="02"
          title="Recursos Materiales"
          resources={event.material_resources}
          onAssign={handleAssign}
          onObservationChange={(
            resourceId,
            observation,
          ) =>
            handleObservationChange(
              "MATERIAL",
              resourceId,
              observation,
            )
          }
        />

        <ResourceConfirmationTable
          step="03"
          title="Recursos Logísticos"
          resources={event.logistic_resources}
          onAssign={handleAssign}
          onObservationChange={(
            resourceId,
            observation,
          ) =>
            handleObservationChange(
              "LOGISTIC",
              resourceId,
              observation,
            )
          }
        />

        <div className="flex justify-between border-t border-[#E8D8DB] pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded border border-[#6B2737] px-6 py-3 text-sm font-medium text-[#6B2737]"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleFinishConfirmation}
            className="rounded bg-[#6B2737] px-6 py-3 text-sm font-medium text-[#FDF6F0]"
          >
            Finalizar confirmación
          </button>

          {humanResourceToAssign && (
            <HumanAssignmentModal
                resource={humanResourceToAssign}
                onClose={() =>
                setHumanResourceToAssign(null)
                }
                onConfirm={() => {
                setEvent((current) => {
                    if (!current) {
                    return current;
                    }

                    return {
                    ...current,
                    human_resources: assignResource(
                        current.human_resources,
                        humanResourceToAssign.id,
                    ),
                    };
                });

                setMessage(
                    `${humanResourceToAssign.name} fue asignado provisionalmente.`,
                );

                setHumanResourceToAssign(null);
                }}
            />
            )}
        </div>
      </section>
    </main>
  );
}