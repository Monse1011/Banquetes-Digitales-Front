"use client";

import type { AgreementResource } from "./agreement-types";

type Props = {
  title: string;
  step: string;
  resources: AgreementResource[];
  onChangeAdjustedQuantity: (
    resourceId: number,
    quantity: number,
  ) => void;
  onAdjustedQuantityComplete?: (
    resource: AgreementResource,
  ) => void;
};

export function AgreementResourceTable({
  title,
  step,
  resources,
  onChangeAdjustedQuantity,
  onAdjustedQuantityComplete,
}: Props) {
  return (
    <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B2737] text-xs font-bold text-white">
          {step}
        </div>

        <h2 className="font-display text-xl font-semibold text-[#2C1A1D]">
          {title}
        </h2>
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-[#7A5055]">
          No hay recursos registrados.
        </p>
      ) : (
        <div className="overflow-hidden rounded border border-[#D4BFC2] bg-white">
          <div className="grid grid-cols-[1fr_80px_80px_100px] gap-3 bg-[#F5EBE8] px-4 py-3 text-xs font-semibold uppercase text-[#7A5055]">
            <div>Recurso</div>
            <div>Solicitada</div>
            <div>Asignada</div>
            <div>Ajustada</div>
          </div>

          {resources.map((resource) => (
            <div
              key={resource.resource_id}
              className="grid grid-cols-[1fr_80px_80px_100px] items-center gap-3 border-t border-[#E8D8DB] px-4 py-3"
            >
              <div className="text-sm font-medium text-[#2C1A1D]">
                {resource.name}
              </div>

              <div className="text-xs text-[#5A3A3E]">
                {resource.requested_quantity}
              </div>

              <div className="text-xs text-[#5A3A3E]">
                {resource.assigned_quantity}
              </div>

              <input
                type="number"
                min={0}
                value={resource.adjusted_quantity}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  onChangeAdjustedQuantity(
                    resource.resource_id,
                    Number.isNaN(value) ? 0 : value,
                  );
                }}
                onBlur={() => {
                  onAdjustedQuantityComplete?.(resource);
                }}
                className="w-full rounded border border-[#D4BFC2] bg-white px-3 py-2 text-xs text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}