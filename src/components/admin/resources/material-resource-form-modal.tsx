"use client";

import { useState } from "react";

import type {
  MaterialResourceFormValues,
  OperativeRoleOption,
} from "./resource-types";

type MaterialResourceFormModalProps = {
  mode: "create" | "edit";
  operativeRoles: OperativeRoleOption[];
  initialValues?: MaterialResourceFormValues;
  onClose: () => void;
  onSubmit: (values: MaterialResourceFormValues) => void;
};

const EMPTY_VALUES: MaterialResourceFormValues = {
  name: "",
  quantity: 1,
  unit_cost: 0,
  operative_role_id: null,
};

export function MaterialResourceFormModal({
  mode,
  operativeRoles,
  initialValues,
  onClose,
  onSubmit,
}: MaterialResourceFormModalProps) {
  const [values, setValues] = useState<MaterialResourceFormValues>(
    initialValues ?? EMPTY_VALUES,
  );

  const isEditMode = mode === "edit";

  const isValid =
    values.name.trim().length > 0 &&
    values.quantity > 0 &&
    values.unit_cost >= 0 &&
    values.operative_role_id !== null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onSubmit({
      name: values.name.trim(),
      quantity: values.quantity,
      unit_cost: values.unit_cost,
      operative_role_id: values.operative_role_id,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            {isEditMode
              ? "Editar Recurso Material"
              : "Agregar Recurso Material"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-lg leading-none text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]">
                Tipo
              </label>

              <input
                type="text"
                value="Material"
                disabled
                className="w-full rounded border border-[#D4BFC2] bg-[#F5EBE8] px-4 py-2.5 text-sm text-[#7A5055]"
              />
            </div>

            <div>
              <label
                htmlFor="material-name"
                className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Nombre <span className="text-[#C0392B]">*</span>
              </label>

              <input
                id="material-name"
                type="text"
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nombre del recurso"
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="material-quantity"
                  className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
                >
                  Cantidad <span className="text-[#C0392B]">*</span>
                </label>

                <input
                  id="material-quantity"
                  type="number"
                  min={1}
                  value={values.quantity}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      quantity: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
                />
              </div>

              <div>
                <label
                  htmlFor="material-unit-cost"
                  className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
                >
                  Costo unitario <span className="text-[#C0392B]">*</span>
                </label>

                <input
                  id="material-unit-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={values.unit_cost}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      unit_cost: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="material-operative-role"
                className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Rol operativo <span className="text-[#C0392B]">*</span>
              </label>

              <select
                id="material-operative-role"
                value={values.operative_role_id ?? ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    operative_role_id: event.target.value
                      ? Number(event.target.value)
                      : null,
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
              >
                <option value="">Seleccionar rol...</option>

                {operativeRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
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
              type="submit"
              disabled={!isValid}
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditMode ? "Guardar cambios" : "Guardar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}