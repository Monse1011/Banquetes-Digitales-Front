"use client";

import { useState } from "react";

import type {
  UserFormValues,
  UserRole,
} from "./user-types";

type Props = {
  mode: "create" | "edit";
  initialValues?: UserFormValues;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const EMPTY_VALUES: UserFormValues = {
  full_name: "",
  email: "",
  role: "",
};

export function UserFormModal({
  mode,
  initialValues,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<UserFormValues>(
    initialValues ?? EMPTY_VALUES,
  );

  const emailIsValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());

  const isValid =
    values.full_name.trim().length > 0 &&
    values.full_name.trim().length <= 100 &&
    emailIsValid &&
    values.role !== "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onSubmit({
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      role: values.role,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
            {mode === "create"
              ? "Registrar usuario"
              : "Editar usuario"}
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
          <div className="space-y-5 p-6">
            <div>
              <div className="mb-2 flex justify-between">
                <label
                  htmlFor="user-name"
                  className="text-xs font-semibold uppercase text-[#5A3A3E]"
                >
                  Nombre completo{" "}
                  <span className="text-[#C0392B]">*</span>
                </label>

                <span className="text-xs text-[#9A7075]">
                  {values.full_name.length} / 100
                </span>
              </div>

              <input
                id="user-name"
                maxLength={100}
                value={values.full_name}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                placeholder="Nombre completo"
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm outline-none focus:border-[#6B2737]"
              />

              <p className="mt-2 text-xs text-[#7A5055]">
                (máx. 100 caracteres)
              </p>
            </div>

            <div>
              <label
                htmlFor="user-email"
                className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Correo electrónico{" "}
                <span className="text-[#C0392B]">*</span>
              </label>

              <input
                id="user-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="ejemplo@banquetes.com"
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm outline-none focus:border-[#6B2737]"
              />
            </div>

            <div>
              <label
                htmlFor="user-role"
                className="mb-2 block text-xs font-semibold uppercase text-[#5A3A3E]"
              >
                Rol de usuario{" "}
                <span className="text-[#C0392B]">*</span>
              </label>

              <select
                id="user-role"
                value={values.role}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    role: event.target.value as UserRole | "",
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm outline-none focus:border-[#6B2737]"
              >
                <option value="">Seleccionar rol...</option>
                <option value="ADMIN">
                  Administrador General
                </option>
                <option value="LOGISTICS">
                  Personal de Logística
                </option>
              </select>
            </div>

            {error && (
              <p className="rounded border border-[#F1C0C0] bg-[#FFF4F4] px-4 py-3 text-sm text-[#C0392B]">
                {error}
              </p>
            )}
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
              {mode === "create" ? "Registrar" : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}