"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { AgreementForm } from "@/components/logistics/agreements/agreement-form";
import { MOCK_AGREEMENT_EVENTS } from "@/components/logistics/agreements/agreement-mocks";

import type {
  AgreementEventData,
  AgreementFormValues,
  GeneratedProposal,
} from "@/components/logistics/agreements/agreement-types";

import { ProposalDetailModal } from "@/components/logistics/agreements/proposal-detail-modal";

export default function AgreementPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [proposal, setProposal] =
  useState<GeneratedProposal | null>(null);

  const eventId = Number(params.id);

  const initialEvent = MOCK_AGREEMENT_EVENTS.find(
    (event) => event.id === eventId,
  );

  const [event, setEvent] =
    useState<AgreementEventData | null>(
      initialEvent ?? null,
    );

  const [message, setMessage] = useState("");

  function handleCancel() {
    router.push("/logistics");
  }

  function handleDownloadProposal() {
    setMessage(
        "Descarga de propuesta preparada en modo mock.",
    );
    }

    function handleSendProposal() {
    setMessage(
        `Propuesta enviada correctamente a ${event?.client_email}.`,
    );
    }

    function handleScheduleEvent() {
    setMessage(
        "La opción Agendar evento quedó habilitada.",
    );
    }

  function handleSave(values: AgreementFormValues) {
    if (!event) {
      return;
    }

    setEvent({
      ...event,
      location: values.location,
      start_date: values.start_date,
      start_time: values.start_time,
      end_date: values.end_date,
      end_time: values.end_time,
      confirmation_observations:
        values.observations,
      human_resources: values.human_resources,
      material_resources:
        values.material_resources,
      logistic_resources:
        values.logistic_resources,
    });

    setMessage(
      "Los acuerdos se guardaron correctamente.",
    );
  }

  function handleGenerateProposal(
    values: AgreementFormValues,
    ) {
    if (!event) {
        return;
    }

    const updatedEvent: AgreementEventData = {
        ...event,
        location: values.location,
        start_date: values.start_date,
        start_time: values.start_time,
        end_date: values.end_date,
        end_time: values.end_time,
        confirmation_observations:
        values.observations,
        human_resources: values.human_resources,
        material_resources:
        values.material_resources,
        logistic_resources:
        values.logistic_resources,
    };

    setEvent(updatedEvent);

    const generatedProposal: GeneratedProposal = {
        proposal_id: 5,
        proposals_code: "PROP-2026-0101",
        name: `Propuesta_${event.client_name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")}_${values.start_date.replaceAll(
        "-",
        "",
        )}_${event.folio}.pdf`,
        creation_date:
        new Date().toISOString().split("T")[0],
        status: "in_review",
        request_status: "Propuesta generada",
        pdf_url: `/api/logistics/requests/${event.id}/proposals/download`,
    };

    setProposal(generatedProposal);

    setMessage(
        "Propuesta generada correctamente.",
    );
    }

  if (!event) {
    return (
      <main className="p-10">
        <section className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-8 text-center">
            <h1 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Evento no encontrado
            </h1>

            <p className="mt-2 text-sm text-[#7A5055]">
              No fue posible encontrar la solicitud
              seleccionada.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/logistics")
              }
              className="mt-5 rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0]"
            >
              Volver a Mis Eventos
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
            Registrar acuerdos
          </h1>

          <p className="mt-1 text-sm text-[#7A5055]">
            {event.folio} - {event.client_name}
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32]">
            {message}
          </div>
        )}

        <AgreementForm
          event={event}
          onCancel={handleCancel}
          onSave={handleSave}
          onGenerateProposal={
            handleGenerateProposal
          }
        />

        {proposal && event && (
            <ProposalDetailModal
                event={event}
                proposal={proposal}
                onClose={() => setProposal(null)}
                onDownload={handleDownloadProposal}
                onSend={handleSendProposal}
                onSchedule={handleScheduleEvent}
            />
            )}
      </section>
    </main>
  );
}