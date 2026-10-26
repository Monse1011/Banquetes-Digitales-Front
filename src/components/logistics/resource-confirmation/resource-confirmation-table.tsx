"use client";

import type { ConfirmationResource } from "./resource-confirmation-types";

type Props = {
  step: string;
  title: string;
  resources: ConfirmationResource[];
  onAssign: (resource: ConfirmationResource) => void;
  onObservationChange: (
    resourceId: number,
    observation: string,
  ) => void;
};

export function ResourceConfirmationTable({
  step,
  title,
  resources,
  onAssign,
  onObservationChange,
}: Props) {
  return (
    <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B2737] text-sm font-semibold text-[#FDF6F0]">
          {step}
        </div>

        <h2 className="font-display text-xl font-semibold text-[#2C1A1D]">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[180px_110px_110px_130px_150px_1fr] border-b border-[#E8D8DB] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
            <div>Recurso</div>
            <div>Cant. sol.</div>
            <div>Cant. disp.</div>
            <div>Estado</div>
            <div>Asignación</div>
            <div>Observación</div>
          </div>

          {resources.map((resource) => {
            const isSufficient =
              resource.sufficiency === "SUFFICIENT";

            return (
              <div
                key={resource.id}
                className="border-b border-[#E8D8DB] last:border-b-0"
              >
                <div className="grid grid-cols-[180px_110px_110px_130px_150px_1fr] items-center py-3.5">
                  <div className="text-sm font-medium text-[#2C1A1D]">
                    {resource.name}
                  </div>

                  <div className="text-sm text-[#5A3A3E]">
                    {resource.requested_quantity}
                  </div>

                  <div className="text-sm text-[#5A3A3E]">
                    {resource.available_quantity}
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isSufficient
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#FFF3E0] text-[#E65100]"
                      }`}
                    >
                      {isSufficient
                        ? "Suficiente"
                        : "Insuficiente"}
                    </span>
                  </div>

                  <div>
                    {isSufficient ? (
                      resource.is_assigned ? (
                        <span className="text-[13px] font-medium text-[#2E7D32]">
                          Asignado
                          {resource.type !== "HUMAN" &&
                          resource.assigned_quantity > 0
                            ? ` (${resource.assigned_quantity})`
                            : ""}{" "}
                          ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAssign(resource)}
                          className="rounded border border-[#E8D8DB] px-3 py-1.5 text-[13px] font-medium text-[#6B2737]"
                        >
                          Asignar
                        </button>
                      )
                    ) : (
                      <span className="text-[13px] text-[#9A7075]">
                        —
                      </span>
                    )}
                  </div>

                  <div>
                    {isSufficient ? (
                      <span className="text-[13px] text-[#9A7075]">
                        —
                      </span>
                    ) : (
                      <span className="text-[13px] font-medium text-[#E65100]">
                        Requiere comentario
                      </span>
                    )}
                  </div>
                </div>

                {!isSufficient && (
                  <div className="pb-3 pl-[180px] pr-6">
                    <textarea
                      value={resource.observation}
                      maxLength={200}
                      rows={2}
                      onChange={(event) =>
                        onObservationChange(
                          resource.id,
                          event.target.value,
                        )
                      }
                      placeholder="Motivo de la insuficiencia, sugerencia o comentario..."
                      className="w-full rounded border border-[#D4BFC2] bg-white p-3 text-[13px] text-[#2C1A1D] outline-none placeholder:text-[#9A7075] focus:border-[#6B2737]"
                    />

                    <p className="mt-1 text-right text-[11px] text-[#9A7075]">
                      {resource.observation.length}/200
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}