"use client";

import { useMemo, useState } from "react";

import type { AgreementResource } from "./agreement-types";

interface HumanCandidate {
  id: number;
  name: string;
  role: string;
  available: boolean;
  conflict?: string;
}

type Props = {
  resource: AgreementResource;
  requiredQuantity: number;
  onClose: () => void;
  onConfirm: (
    resourceId: number,
    selectedPeopleIds: number[],
  ) => void;
};

const MOCK_CANDIDATES: HumanCandidate[] = [
  {
    id: 1,
    name: "Juan Pérez",
    role: "Mesero",
    available: true,
  },
  {
    id: 2,
    name: "Ana López",
    role: "Mesero",
    available: false,
    conflict:
      "Conflicto: RES-004, 15/06/2026 17:00-22:00",
  },
  {
    id: 3,
    name: "Carlos Ruiz",
    role: "Mesero",
    available: true,
  },
  {
    id: 4,
    name: "Fernanda Gómez",
    role: "Mesero",
    available: true,
  },
  {
    id: 5,
    name: "José Martínez",
    role: "Mesero",
    available: true,
  },
];

export function HumanResourceSelectionModal({
  resource,
  requiredQuantity,
  onClose,
  onConfirm,
}: Props) {
  const [selectedPeople, setSelectedPeople] =
    useState<number[]>([]);

  const availableCandidates = useMemo(
    () =>
      MOCK_CANDIDATES.filter(
        (candidate) => candidate.available,
      ),
    [],
  );

  const canConfirm =
    selectedPeople.length === requiredQuantity;

  function togglePerson(candidate: HumanCandidate) {
    if (!candidate.available) {
      return;
    }

    setSelectedPeople((current) => {
      if (current.includes(candidate.id)) {
        return current.filter(
          (id) => id !== candidate.id,
        );
      }

      if (current.length >= requiredQuantity) {
        return current;
      }

      return [...current, candidate.id];
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[560px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Seleccionar personal
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              {resource.name}
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

        <div className="p-6">
          <div className="mb-4 rounded bg-[#F5EBE8] px-4 py-3">
            <p className="text-sm text-[#5A3A3E]">
              Selecciona{" "}
              <strong>{requiredQuantity}</strong>{" "}
              persona
              {requiredQuantity === 1 ? "" : "s"}.
            </p>

            <p className="mt-1 text-xs text-[#7A5055]">
              Seleccionados: {selectedPeople.length} /{" "}
              {requiredQuantity}
            </p>
          </div>

          <div className="space-y-3">
            {MOCK_CANDIDATES.map((candidate) => {
              const selected =
                selectedPeople.includes(candidate.id);

              return (
                <button
                  key={candidate.id}
                  type="button"
                  disabled={!candidate.available}
                  onClick={() =>
                    togglePerson(candidate)
                  }
                  className={`w-full rounded border p-4 text-left ${
                    selected
                      ? "border-[#6B2737] bg-[#F5EBE8]"
                      : "border-[#E8D8DB] bg-white"
                  } ${
                    !candidate.available
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#2C1A1D]">
                        {candidate.name}
                      </p>

                      <p className="mt-1 text-xs text-[#7A5055]">
                        {candidate.role}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        candidate.available
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#FDECEC] text-[#C0392B]"
                      }`}
                    >
                      {candidate.available
                        ? "Disponible"
                        : "No disponible"}
                    </span>
                  </div>

                  {candidate.conflict && (
                    <p className="mt-2 text-xs text-[#C0392B]">
                      {candidate.conflict}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {availableCandidates.length <
            requiredQuantity && (
            <p className="mt-4 text-sm text-[#C0392B]">
              No hay suficiente personal disponible para
              cubrir la cantidad ajustada.
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
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm(
                resource.resource_id,
                selectedPeople,
              )
            }
            className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar selección
          </button>
        </footer>
      </section>
    </div>
  );
}