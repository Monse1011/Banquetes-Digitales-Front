"use client";

import { useState } from "react";

import { OPERATIVE_ROLE_NAME_MAX_LENGTH, type OperativeRoleFormValues } from "./operative-role-types";
import { OperativeRoleDialog } from "./operative-role-dialog";

type Props = {
  mode: "create" | "edit";
  initialValues?: OperativeRoleFormValues;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (values: OperativeRoleFormValues) => void;
};

const EMPTY_VALUES: OperativeRoleFormValues = {
  name: "",
};

export function OperativeRoleFormModal({
  mode,
  initialValues,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<OperativeRoleFormValues>(
    initialValues ?? EMPTY_VALUES,
  );

  const isValid =
    values.name.trim().length > 0 &&
    values.name.trim().length <= OPERATIVE_ROLE_NAME_MAX_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || busy) {
      return;
    }

    onSubmit({
      name: values.name.trim(),
    });
  }

  return (
    <OperativeRoleDialog title={mode === "create" ? "Agregar Rol Operativo" : "Editar Rol Operativo"} busy={busy} onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {error && <p role="alert" id="operative-role-error" className="mb-4 rounded border border-[#E6B8B8] bg-[#FFF4F2] p-3 text-sm text-[#C0392B]">{error}</p>}
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="operative-role-name"
                className="text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Nombre del rol{" "}
                <span className="text-[#C0392B]">*</span>
              </label>

              <span className="text-xs text-[#9A7075]">
                {values.name.length} / {OPERATIVE_ROLE_NAME_MAX_LENGTH}
              </span>
            </div>

            <input
              id="operative-role-name"
              type="text"
              required
              disabled={busy}
              maxLength={OPERATIVE_ROLE_NAME_MAX_LENGTH}
              aria-describedby={error ? "operative-role-error operative-role-help" : "operative-role-help"}
              value={values.name}
              onChange={(event) =>
                setValues({
                  name: event.target.value,
                })
              }
              placeholder="Nombre del rol operativo"
              className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
            />

            <p id="operative-role-help" className="mt-2 text-xs text-[#7A5055]">
              Máximo {OPERATIVE_ROLE_NAME_MAX_LENGTH} caracteres. El nombre no debe estar repetido.
            </p>
          </div>

          <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-6">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded border border-[#E8D8DB] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isValid || busy}
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </footer>
        </form>
    </OperativeRoleDialog>
  );
}
