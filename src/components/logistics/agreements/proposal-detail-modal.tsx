"use client";

import { useState } from "react";

import type {
  AgreementEventData,
  GeneratedProposal,
} from "./agreement-types";

type Props = {
  event: AgreementEventData;
  proposal: GeneratedProposal;
  onClose: () => void;
  onDownload: () => void;
  onSend: () => void;
  onSchedule: () => void;
};

export function ProposalDetailModal({
  event,
  proposal,
  onClose,
  onDownload,
  onSend,
  onSchedule,
}: Props) {
  const [showPreview, setShowPreview] =
    useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Propuesta generada
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

        <div className="flex flex-col gap-5 p-6">
          <div className="rounded border border-[#C8E6C9] bg-[#E8F5E9] px-4 py-3">
            <p className="text-sm font-medium text-[#2E7D32]">
              La propuesta fue generada correctamente.
            </p>

            <p className="mt-1 text-xs text-[#2E7D32]">
              Estado de la solicitud: Propuesta generada
            </p>
          </div>

          <section className="grid gap-4 rounded border border-[#E8D8DB] bg-white p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Folio de propuesta
              </p>

              <p className="mt-1 text-sm font-medium text-[#2C1A1D]">
                {proposal.proposals_code}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Fecha de generación
              </p>

              <p className="mt-1 text-sm text-[#2C1A1D]">
                {proposal.creation_date}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase text-[#7A5055]">
                Archivo
              </p>

              <p className="mt-1 break-all text-sm text-[#2C1A1D]">
                {proposal.name}
              </p>
            </div>
          </section>

          {showPreview && (
            <section className="rounded border border-[#E8D8DB] bg-white p-6">
              <div className="mb-5 border-b border-[#E8D8DB] pb-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B2737]">
                  Banquetes Elegancia
                </p>

                <h3 className="mt-2 font-display text-2xl font-semibold text-[#2C1A1D]">
                  Propuesta de Servicio
                </h3>

                <p className="mt-1 text-sm text-[#7A5055]">
                  {proposal.proposals_code}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#7A5055]">
                    Cliente
                  </p>

                  <p className="mt-1 text-sm text-[#2C1A1D]">
                    {event.client_name}
                  </p>

                  <p className="text-sm text-[#5A3A3E]">
                    {event.client_email}
                  </p>

                  <p className="text-sm text-[#5A3A3E]">
                    {event.client_phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-[#7A5055]">
                    Evento
                  </p>

                  <p className="mt-1 text-sm text-[#2C1A1D]">
                    {event.start_date} ·{" "}
                    {event.start_time} - {event.end_time}
                  </p>

                  <p className="text-sm text-[#5A3A3E]">
                    {event.location}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-[#7A5055]">
                  Recursos confirmados
                </p>

                <div className="mt-2 space-y-1 text-sm text-[#5A3A3E]">
                  {[
                    ...event.human_resources,
                    ...event.material_resources,
                    ...event.logistic_resources,
                  ].map((resource) => (
                    <p key={`${resource.type}-${resource.resource_id}`}>
                      • {resource.name} ·{" "}
                      {resource.adjusted_quantity}
                    </p>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-xs italic text-[#9A7075]">
                Vista previa del documento en modo mock.
              </p>
            </section>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8D8DB] p-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowPreview((current) => !current)
              }
              className="rounded border border-[#E8D8DB] px-4 py-2.5 text-sm font-medium text-[#6B2737]"
            >
              {showPreview
                ? "Ocultar vista previa"
                : "Visualizar"}
            </button>

            <button
              type="button"
              onClick={onDownload}
              className="rounded border border-[#E8D8DB] px-4 py-2.5 text-sm font-medium text-[#6B2737]"
            >
              Descargar
            </button>

            <button
              type="button"
              onClick={onSend}
              className="rounded border border-[#E8D8DB] px-4 py-2.5 text-sm font-medium text-[#6B2737]"
            >
              Enviar al cliente
            </button>
          </div>

          <button
            type="button"
            onClick={onSchedule}
            className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0]"
          >
            Agendar evento
          </button>
        </footer>
      </section>
    </div>
  );
}