"use client";

import { useState } from "react";
import { ErrorState } from "@/components/backstage/common";
import { Button } from "@/components/ui/button";
import { Alert, Badge, LoadingBlock } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form";
import { Card, CardHeader, DetailList } from "@/components/ui/layout";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage } from "@/lib/api/http";
import { changedResources, getAgreements, saveAgreements, type Agreements } from "@/lib/api/logistics";
import { RESOURCE_TYPE_LABELS } from "@/lib/api/resources";
import { formatDateTime, formatMoney, toInputParts, toMeridaDateTime } from "@/lib/format";
import { useQuery } from "@/lib/hooks";

type Form = {
  location: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  observations: string;
  quantities: Record<number, string>;
};

function toForm(data: Agreements): Form {
  const start = toInputParts(data.start_datetime);
  const end = toInputParts(data.end_datetime);
  return {
    location: data.location ?? "",
    start_date: start.date,
    start_time: start.time,
    end_date: end.date,
    end_time: end.time,
    observations: data.observations ?? "",
    quantities: Object.fromEntries(data.assigned_resources.map((r) => [r.resource_id, String(r.quantity)])),
  };
}

export function AgreementsTab({ requestId, onChanged }: { requestId: number; onChanged: () => void }) {
  const { data, error, loading, reload } = useQuery(() => getAgreements(requestId), String(requestId));
  if (loading && !data) return <LoadingBlock />;
  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;
  // `key` reinicia el formulario con cada revisión guardada.
  return (
    <AgreementsForm
      key={`${data.derived_information_id}-${data.status}`}
      data={data}
      requestId={requestId}
      onSaved={() => {
        reload();
        onChanged();
      }}
      onConflict={reload}
    />
  );
}

function AgreementsForm({
  data,
  requestId,
  onSaved,
  onConflict,
}: {
  data: Agreements;
  requestId: number;
  onSaved: () => void;
  onConflict: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(() => toForm(data));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<{ text: string; conflict: boolean; details: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = data.can_register_agreements;
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const subtotal = data.assigned_resources.reduce(
    (sum, r) => sum + Number(form.quantities[r.resource_id] ?? r.quantity) * Number(r.unit_cost ?? 0),
    0,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!form.location.trim()) found.location = "La ubicación es obligatoria.";
    // Mismas claves que errors.<campo> del back; las reglas de horario las valida el back.
    if (!form.start_date || !form.start_time) found.start_datetime = "Indica fecha y hora de inicio.";
    if (!form.end_date || !form.end_time) found.end_datetime = "Indica fecha y hora de término.";
    for (const r of data.assigned_resources) {
      const raw = form.quantities[r.resource_id];
      const q = Number(raw);
      // Vacío no es 0: liberar debe ser explícito.
      if (raw === "" || !Number.isInteger(q) || q < 0) found[`q${r.resource_id}`] = "Entero ≥ 0";
    }
    setErrors(found);
    setError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await saveAgreements(requestId, {
        location: form.location.trim(),
        start_datetime: toMeridaDateTime(form.start_date, form.start_time),
        end_datetime: toMeridaDateTime(form.end_date, form.end_time),
        observations: form.observations.trim() || null,
        adjusted_resources: changedResources(data.assigned_resources, form.quantities),
        derived_information_id: data.derived_information_id,
      });
      toast.success("Acuerdos guardados.");
      onSaved();
    } catch (err) {
      const api = err instanceof ApiError ? err : null;
      const conflicts = (api?.payload.conflicts as { message?: string }[] | undefined) ?? [];
      setErrors(api?.fieldErrors ?? {});
      setError({
        text: errorMessage(err),
        conflict: api?.status === 409 && conflicts.length === 0,
        details: conflicts.map((c) => c.message ?? "").filter(Boolean),
      });
    } finally {
      // Tras un error el formulario queda editable para corregir y volver a asignar.
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {!editable ? (
        <Alert tone="info">
          Los acuerdos solo se registran cuando la coordinación está lista o incompleta, o cuando el cliente pidió ajustes.
        </Alert>
      ) : null}
      {data.confirmation_observations ? (
        <Alert tone="info" title="Observaciones de la confirmación de recursos">
          {data.confirmation_observations}
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Acuerdos con el cliente"
          description={data.derived_information_id ? `Revisión #${data.derived_information_id}` : "Aún no se han registrado acuerdos."}
        />
        <fieldset disabled={!editable || busy} className="space-y-4 p-5">
          <TextField
            label="Ubicación"
            value={form.location}
            onChange={(e) => set({ location: e.target.value })}
            error={errors.location}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-[3fr_2fr] gap-2">
              <TextField label="Inicio" type="date" value={form.start_date} onChange={(e) => set({ start_date: e.target.value })} error={errors.start_datetime} required />
              <TextField label="Hora" type="time" value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} required />
            </div>
            <div className="grid grid-cols-[3fr_2fr] gap-2">
              <TextField label="Término" type="date" value={form.end_date} onChange={(e) => set({ end_date: e.target.value })} error={errors.end_datetime} required />
              <TextField label="Hora" type="time" value={form.end_time} onChange={(e) => set({ end_time: e.target.value })} required />
            </div>
          </div>
          <TextAreaField
            label="Observaciones y acuerdos"
            rows={3}
            value={form.observations}
            onChange={(e) => set({ observations: e.target.value })}
            error={errors.observations}
          />
        </fieldset>
      </Card>

      <Card>
        <CardHeader
          title="Recursos confirmados"
          description="Ajusta solo lo que cambia; los recursos que no toques se conservan. Cantidad 0 libera el recurso."
        />
        {errors.adjusted_resources ? (
          <div className="px-5 pt-4">
            <Alert tone="danger">{errors.adjusted_resources}</Alert>
          </div>
        ) : null}
        {data.assigned_resources.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No hay recursos confirmados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Recurso</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="hidden px-5 py-3 text-right font-medium sm:table-cell">Costo unitario</th>
                  <th className="px-5 py-3 font-medium">Cantidad</th>
                  <th className="px-5 py-3 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.assigned_resources.map((r) => {
                  const q = Number(form.quantities[r.resource_id] ?? 0);
                  const releasing = form.quantities[r.resource_id] !== "" && q === 0 && r.quantity > 0;
                  return (
                    <tr key={r.resource_id}>
                      <td className="px-5 py-3">{r.name}</td>
                      <td className="px-5 py-3 text-muted">{RESOURCE_TYPE_LABELS[r.type] ?? r.type}</td>
                      <td className="hidden px-5 py-3 text-right sm:table-cell">{formatMoney(r.unit_cost ?? 0)}</td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          disabled={!editable || busy}
                          aria-label={`Cantidad de ${r.name}`}
                          value={form.quantities[r.resource_id] ?? ""}
                          onChange={(e) => set({ quantities: { ...form.quantities, [r.resource_id]: e.target.value } })}
                          className={`h-9 w-24 rounded-lg border px-2 text-sm focus:border-gold focus:outline-none disabled:bg-cream ${
                            errors[`q${r.resource_id}`] ? "border-danger" : "border-line"
                          }`}
                        />
                        {releasing ? (
                          <span className="ml-2">
                            <Badge tone="warn">Se liberará al guardar</Badge>
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right">{formatMoney(q * Number(r.unit_cost ?? 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line font-medium">
                  <td colSpan={4} className="px-5 py-3 text-right">
                    Subtotal estimado
                    <span className="block text-xs font-normal text-muted">
                      No incluye personal; el total se calcula al generar la propuesta.
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">{formatMoney(subtotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <DetailList
        items={[
          { label: "Cliente", value: `${data.client.client_name} · ${data.client.client_phone}` },
          { label: "Horario actual", value: `${formatDateTime(data.start_datetime)} – ${formatDateTime(data.end_datetime)}` },
        ]}
      />

      {error ? (
        <Alert
          tone="danger"
          title={error.conflict ? "Los acuerdos cambiaron" : undefined}
          action={
            error.conflict ? (
              <Button size="sm" variant="secondary" onClick={onConflict}>
                Recargar
              </Button>
            ) : undefined
          }
        >
          {error.text}
          {error.details.length ? (
            <ul className="mt-2 list-disc pl-5">
              {error.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}
      {editable ? (
        <div className="flex justify-end">
          <Button type="submit" loading={busy}>
            Guardar acuerdos
          </Button>
        </div>
      ) : null}
    </form>
  );
}
