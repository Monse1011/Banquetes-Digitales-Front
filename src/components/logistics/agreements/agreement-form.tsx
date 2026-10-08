"use client";

import { useState } from "react";

import { HumanResourceSelectionModal } from "./human-resource-selection-modal";

import { AgreementResourceTable } from "./agreement-resource-table";

import type {
  AgreementEventData,
  AgreementFormValues,
  AgreementResource,
} from "./agreement-types";

type Props = {
  event: AgreementEventData;
  onCancel: () => void;
  onSave: (values: AgreementFormValues) => void;
  onGenerateProposal: (values: AgreementFormValues) => void;
};

type FormErrors = Partial<
  Record<
    | "location"
    | "start_date"
    | "start_time"
    | "end_date"
    | "end_time"
    | "resources",
    string
  >
>;

function updateResourceQuantity(
  resources: AgreementResource[],
  resourceId: number,
  quantity: number,
) {
  return resources.map((resource) =>
    resource.resource_id === resourceId
      ? {
          ...resource,
          adjusted_quantity: quantity,
        }
      : resource,
  );
}

export function AgreementForm({
  event,
  onCancel,
  onSave,
  onGenerateProposal,
}: Props) {

  const [values, setValues] =
    useState<AgreementFormValues>({
      location: event.location,
      start_date: event.start_date,
      start_time: event.start_time,
      end_date: event.end_date,
      end_time: event.end_time,
      observations:
        event.confirmation_observations ?? "",
      human_resources: event.human_resources,
      material_resources:
        event.material_resources,
      logistic_resources:
        event.logistic_resources,
    });


    const [humanResourceToSelect, setHumanResourceToSelect] =
        useState<AgreementResource | null>(null);
    const [humanSelections, setHumanSelections] =
        useState<Record<number, number[]>>({});
        
  const [errors, setErrors] =
    useState<FormErrors>({});

  function validate() {
    const nextErrors: FormErrors = {};

    if (!values.location.trim()) {
      nextErrors.location =
        "El campo ubicación es obligatorio.";
    }

    if (!values.start_date) {
      nextErrors.start_date =
        "El campo fecha de inicio es obligatorio.";
    }

    if (!values.start_time) {
      nextErrors.start_time =
        "El campo hora de inicio es obligatorio.";
    }

    if (!values.end_date) {
      nextErrors.end_date =
        "El campo fecha de fin es obligatorio.";
    }

    if (!values.end_time) {
      nextErrors.end_time =
        "El campo hora de fin es obligatorio.";
    }

    const start = new Date(
      `${values.start_date}T${values.start_time}:00`,
    );

    const end = new Date(
      `${values.end_date}T${values.end_time}:00`,
    );

    if (
      values.start_date &&
      values.start_time &&
      values.end_date &&
      values.end_time &&
      end <= start
    ) {
      nextErrors.end_time =
        "La hora de fin debe ser posterior a la de inicio.";
    }

    const allResources = [
      ...values.human_resources,
      ...values.material_resources,
      ...values.logistic_resources,
    ];

    const invalidNegative =
      allResources.some(
        (resource) =>
          resource.adjusted_quantity < 0 ||
          !Number.isInteger(
            resource.adjusted_quantity,
          ),
      );

    if (invalidNegative) {
      nextErrors.resources =
        "Las cantidades ajustadas deben ser números enteros mayores o iguales a 0.";
    }

    const unavailableResource =
      allResources.find(
        (resource) =>
          resource.adjusted_quantity >
          resource.available_quantity,
      );

    if (unavailableResource) {
      nextErrors.resources =
        `La cantidad ajustada de ${unavailableResource.name} excede la disponibilidad (${unavailableResource.available_quantity}) para el horario indicado.`;
    }

    const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDateOnly = new Date(
        `${values.start_date}T00:00:00`,
        );

        if (
        values.start_date &&
        startDateOnly < today
        ) {
        nextErrors.start_date =
            "La fecha no puede ser anterior a la actual.";
        }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSave() {
    if (!validate()) {
      return;
    }

    onSave(values);
  }

  function handleGenerateProposal() {
    if (!validate()) {
      return;
    }

    onGenerateProposal(values);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
        <p className="text-xs font-semibold uppercase text-[#7A5055]">
          Cliente
        </p>

        <h2 className="mt-1 font-display text-2xl font-semibold text-[#2C1A1D]">
          {event.client_name}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
              Teléfono
            </label>

            <input
              type="text"
              value={event.client_phone}
              readOnly
              className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm text-[#2C1A1D]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
              Correo
            </label>

            <input
              type="text"
              value={event.client_email}
              readOnly
              className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm text-[#2C1A1D]"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B2737] text-xs font-bold text-white">
            01
          </div>

          <h2 className="font-display text-xl font-semibold text-[#2C1A1D]">
            Horario confirmado
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
              Ubicación
            </label>

            <input
              type="text"
              value={values.location}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
              className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm text-[#2C1A1D]"
            />

            {errors.location && (
              <p className="mt-1 text-xs text-[#C0392B]">
                {errors.location}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
                Fecha inicio
              </label>

              <input
                type="date"
                value={values.start_date}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    start_date:
                      event.target.value,
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm"
              />

              {errors.start_date && (
                <p className="mt-1 text-xs text-[#C0392B]">
                  {errors.start_date}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
                Hora inicio
              </label>

              <input
                type="time"
                value={values.start_time}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    start_time:
                      event.target.value,
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm"
              />

              {errors.start_time && (
                <p className="mt-1 text-xs text-[#C0392B]">
                  {errors.start_time}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
                Fecha fin
              </label>

              <input
                type="date"
                value={values.end_date}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    end_date:
                      event.target.value,
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm"
              />

              {errors.end_date && (
                <p className="mt-1 text-xs text-[#C0392B]">
                  {errors.end_date}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase text-[#7A5055]">
                Hora fin
              </label>

              <input
                type="time"
                value={values.end_time}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    end_time:
                      event.target.value,
                  }))
                }
                className="w-full rounded border border-[#D4BFC2] bg-white px-4 py-3 text-sm"
              />

              {errors.end_time && (
                <p className="mt-1 text-xs text-[#C0392B]">
                  {errors.end_time}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <AgreementResourceTable
        step="02"
        title="Recursos Humanos"
        resources={values.human_resources}
        onChangeAdjustedQuantity={(resourceId, quantity) =>
            setValues((current) => ({
            ...current,
            human_resources: updateResourceQuantity(
                current.human_resources,
                resourceId,
                quantity,
            ),
            }))
        }
        onAdjustedQuantityComplete={(resource) => {
            if (
            resource.adjusted_quantity !==
            resource.assigned_quantity
            ) {
            setHumanResourceToSelect(resource);
            }
        }}
        />

      <AgreementResourceTable
        step="03"
        title="Recursos Materiales"
        resources={values.material_resources}
        onChangeAdjustedQuantity={(
          resourceId,
          quantity,
        ) =>
          setValues((current) => ({
            ...current,
            material_resources:
              updateResourceQuantity(
                current.material_resources,
                resourceId,
                quantity,
              ),
          }))
        }
      />

      <AgreementResourceTable
        step="04"
        title="Recursos Logísticos"
        resources={values.logistic_resources}
        onChangeAdjustedQuantity={(
          resourceId,
          quantity,
        ) =>
          setValues((current) => ({
            ...current,
            logistic_resources:
              updateResourceQuantity(
                current.logistic_resources,
                resourceId,
                quantity,
              ),
          }))
        }
      />

      <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6B2737] text-xs font-bold text-white">
            05
          </div>

          <h2 className="font-display text-xl font-semibold text-[#2C1A1D]">
            Observaciones de la confirmación
          </h2>
        </div>

        <textarea
          value={values.observations}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              observations:
                event.target.value,
            }))
          }
          rows={4}
          className="w-full rounded border border-[#D4BFC2] bg-white p-4 text-sm text-[#2C1A1D]"
        />

        {errors.resources && (
          <p className="mt-3 text-sm text-[#C0392B]">
            {errors.resources}
          </p>
        )}
      </section>

      <div className="flex flex-wrap justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-[#6B2737] px-6 py-3 text-sm font-medium text-[#6B2737]"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="rounded border border-[#6B2737] px-6 py-3 text-sm font-medium text-[#6B2737]"
        >
          Guardar acuerdos
        </button>

        <button
          type="button"
          onClick={handleGenerateProposal}
          className="rounded bg-[#6B2737] px-6 py-3 text-sm font-medium text-[#FDF6F0]"
        >
          Generar propuesta
        </button>

        {humanResourceToSelect && (
            <HumanResourceSelectionModal
                resource={humanResourceToSelect}
                requiredQuantity={
                humanResourceToSelect.adjusted_quantity
                }
                onClose={() => {
                setHumanResourceToSelect(null);
                }}
                onConfirm={(resourceId, selectedPeopleIds) => {
                setHumanSelections((current) => ({
                    ...current,
                    [resourceId]: selectedPeopleIds,
                }));

                setHumanResourceToSelect(null);
                }}
            />
            )}
      </div>
    </div>
  );
}