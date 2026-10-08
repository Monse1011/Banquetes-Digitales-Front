"use client";

import type { UnifiedResource } from "./resource-types";

type ResourceDetailModalProps = {
  resource: UnifiedResource;
  onClose: () => void;
};

const TYPE_LABELS = {
  HUMAN: "Humano",
  MATERIAL: "Material",
  LOGISTIC: "Logístico",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export function ResourceDetailModal({
  resource,
  onClose,
}: ResourceDetailModalProps) {
  const isHuman = resource.type === "HUMAN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[620px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Detalle del Recurso
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              {resource.identifier}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-lg leading-none text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
          <DetailField
            label="Identificador"
            value={resource.identifier}
          />

          <DetailField
            label="Tipo"
            value={TYPE_LABELS[resource.type]}
          />

          <DetailField
            label={isHuman ? "Nombre completo" : "Nombre"}
            value={resource.name}
          />

          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-[#7A5055]">
              Estado
            </p>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                resource.is_active
                  ? "bg-[#E8F5E9] text-[#2E7D32]"
                  : "bg-[#F5EBE8] text-[#7A5055]"
              }`}
            >
              {resource.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>

          {isHuman ? (
            <DetailField
              label="Rol operativo"
              value={resource.operative_role_name ?? "—"}
            />
          ) : (
            <>
              <DetailField
                label="Cantidad en stock"
                value={String(resource.quantity ?? "—")}
              />

              <DetailField
                label="Costo unitario"
                value={
                  resource.unit_cost !== undefined
                    ? formatCurrency(resource.unit_cost)
                    : "—"
                }
              />
            </>
          )}

          <DetailField
            label="Fecha de registro"
            value={formatDate(resource.created_at)}
          />

          <DetailField
            label="Última modificación"
            value={formatDate(resource.updated_at)}
          />
        </div>

        <footer className="flex justify-end border-t border-[#E8D8DB] p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#E8D8DB] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value: string;
};

function DetailField({
  label,
  value,
}: DetailFieldProps) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-[#7A5055]">
        {label}
      </p>

      <p className="text-sm font-medium text-[#2C1A1D]">
        {value}
      </p>
    </div>
  );
}