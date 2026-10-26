"use client";

import { useState } from "react";

import type {
  HumanResourceFormValues,
  OperativeRoleOption,
} from "./resource-types";

type HumanResourceFormModalProps = {
  mode: "create" | "edit";
  operativeRoles: OperativeRoleOption[];
  initialValues?: HumanResourceFormValues;
  onClose: () => void;
  onSubmit: (values: HumanResourceFormValues) => void;
};

const EMPTY_VALUES: HumanResourceFormValues = {
  name: "",
  operative_role_id: null,
};

export function HumanResourceFormModal({
  mode,
  operativeRoles,
  initialValues,
  onClose,
  onSubmit,
}: HumanResourceFormModalProps) {
  const [values, setValues] = useState<HumanResourceFormValues>(
    initialValues ?? EMPTY_VALUES,
  );


  

  const isEditMode = mode === "edit";

  const title = isEditMode
    ? "Editar Recurso Humano"
    : "Agregar Recurso Humano";

  const isValid =
    values.name.trim().length > 0 &&
    values.name.trim().length <= 100 &&
    values.operative_role_id !== null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onSubmit({
      name: values.name.trim(),
      operative_role_id: values.operative_role_id,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            {title}
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
                Tipo <span className="text-[#C0392B]">*</span>
              </label>

              <input
                type="text"
                value="Humano"
                disabled
                className="w-full rounded border border-[#D4BFC2] bg-[#F5EBE8] px-4 py-2.5 text-sm text-[#7A5055]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="human-resource-name"
                  className="text-xs font-semibold uppercase text-[#5A3A3E]"
                >
                  Nombre completo <span className="text-[#C0392B]">*</span>
                </label>

                <span className="text-xs text-[#9A7075]">
                  {values.name.length} / 100
                </span>
              </div>

              <input
                id="human-resource-name"
                type="text"
                maxLength={100}
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nombre completo"
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
              />

              <p className="mt-1 text-xs text-[#7A5055]">
                (máx. 100 caracteres)
              </p>
            </div>

            <div>
              <label
                htmlFor="operative-role"
                className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Rol operativo <span className="text-[#C0392B]">*</span>
              </label>

              <select
                id="operative-role"
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
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditMode ? "Guardar cambios" : "Guardar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}