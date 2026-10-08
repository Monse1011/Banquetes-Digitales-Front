"use client";

import { useState } from "react";

import type { ConfirmationResource } from "./resource-confirmation-types";

type Person = {
  id: number;
  name: string;
  role: string;
  available: boolean;
  conflict?: string;
};

type Props = {
  resource: ConfirmationResource;
  onClose: () => void;
  onConfirm: (personIds: number[]) => void;
};

const MOCK_PEOPLE: Person[] = [
  {
    id: 1,
    name: "Juan Pérez",
    role: "Chef",
    available: true,
  },
  {
    id: 2,
    name: "Laura Méndez",
    role: "Chef",
    available: true,
  },
  {
    id: 3,
    name: "Carlos Gómez",
    role: "Chef",
    available: true,
  },
  {
    id: 4,
    name: "Miguel Torres",
    role: "Chef",
    available: false,
    conflict: "Asignado a otro evento en horario conflictivo.",
  },
];

export function HumanAssignmentModal({
  resource,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<number[]>([]);

  const required = resource.requested_quantity;

  const candidates = MOCK_PEOPLE.filter(
    (person) =>
      person.role === resource.operative_role,
  );

  function togglePerson(person: Person) {
    if (!person.available) {
      return;
    }

    setSelected((current) => {
      if (current.includes(person.id)) {
        return current.filter(
          (id) => id !== person.id,
        );
      }

      if (current.length >= required) {
        return current;
      }

      return [...current, person.id];
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[560px] rounded-lg border border-[#E8D8DB] bg-[#FDFAF8]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Asignar personal
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              {resource.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="p-6">
          <div className="mb-4 rounded bg-[#F5EBE8] p-4">
            <p className="text-sm text-[#5A3A3E]">
              Selecciona{" "}
              <strong>{required}</strong>{" "}
              persona
              {required === 1 ? "" : "s"}.
            </p>

            <p className="mt-1 text-xs text-[#7A5055]">
              Seleccionados: {selected.length}/{required}
            </p>
          </div>

          <div className="space-y-3">
            {candidates.map((person) => {
              const isSelected =
                selected.includes(person.id);

              return (
                <button
                  key={person.id}
                  type="button"
                  disabled={!person.available}
                  onClick={() => togglePerson(person)}
                  className={`w-full rounded border p-4 text-left ${
                    isSelected
                      ? "border-[#6B2737] bg-[#F5EBE8]"
                      : "border-[#E8D8DB] bg-white"
                  } ${
                    !person.available
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#2C1A1D]">
                        {person.name}
                      </p>

                      <p className="mt-1 text-xs text-[#7A5055]">
                        {person.role}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        person.available
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#FFF3E0] text-[#E65100]"
                      }`}
                    >
                      {person.available
                        ? "Disponible"
                        : "No disponible"}
                    </span>
                  </div>

                  {person.conflict && (
                    <p className="mt-2 text-xs text-[#E65100]">
                      {person.conflict}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={selected.length !== required}
            onClick={() => onConfirm(selected)}
            className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Asignar
          </button>
        </footer>
      </section>
    </div>
  );
}