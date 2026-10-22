"use client";

import { useState } from "react";

import type { OperativeRoleFormValues } from "./operative-role-types";

type Props = {
  mode: "create" | "edit";
  initialValues?: OperativeRoleFormValues;
  onClose: () => void;
  onSubmit: (values: OperativeRoleFormValues) => void;
};

const EMPTY_VALUES: OperativeRoleFormValues = {
  name: "",
};

export function OperativeRoleFormModal({
  mode,
  initialValues,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<OperativeRoleFormValues>(
    initialValues ?? EMPTY_VALUES,
  );

  const isValid =
    values.name.trim().length > 0 &&
    values.name.trim().length <= 50;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onSubmit({
      name: values.name.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            {mode === "create"
              ? "Agregar Rol Operativo"
              : "Editar Rol Operativo"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-lg text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="operative-role-name"
                className="text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Nombre del rol{" "}
                <span className="text-[#C0392B]">*</span>
              </label>

              <span className="text-xs text-[#9A7075]">
                {values.name.length} / 50
              </span>
            </div>

            <input
              id="operative-role-name"
              type="text"
              maxLength={50}
              value={values.name}
              onChange={(event) =>
                setValues({
                  name: event.target.value,
                })
              }
              placeholder="Nombre del rol operativo"
              className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
            />

            <p className="mt-2 text-xs text-[#7A5055]">
              (máx. 50 caracteres)
            </p>
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
              Guardar
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}