"use client";

import { useState } from "react";
import { ErrorState, SearchInput } from "@/components/backstage/common";
import { Button } from "@/components/ui/button";
import { Alert, Badge, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { TextAreaField } from "@/components/ui/form";
import { Card, Pagination, Tabs } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage } from "@/lib/api/http";
import {
  assignProvisional,
  defaultUsageWindow,
  cancelProvisional,
  confirmResources,
  listAvailability,
  releaseProvisional,
  type AvailableResource,
  type ConfirmationResult,
} from "@/lib/api/logistics";
import type { ResourceType } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";

type Draft = Record<number, { quantity: string; observation: string }>;

const TYPES: { value: ResourceType; label: string }[] = [
  { value: "HUMAN", label: "Personal" },
  { value: "MATERIAL", label: "Material" },
  { value: "LOGISTIC", label: "Logística" },
];

export function ResourcesTab({ requestId, onChanged }: { requestId: number; onChanged: () => void }) {
  const toast = useToast();
  const [type, setType] = useState<ResourceType>("HUMAN");
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [result, setResult] = useState<ConfirmationResult | null>(null);

  const { data, error: loadError, loading, reload } = useQuery(
    () => listAvailability(type, requestId, { name, page, per_page: 25 }),
    `${type}-${name}-${page}`,
  );

  const meta = data?.request ?? null;
  const pending = Object.entries(draft).filter(([, value]) => Number(value.quantity) > 0);

  const setRow = (id: number, patch: Partial<Draft[number]>) =>
    setDraft((d) => ({ ...d, [id]: { quantity: d[id]?.quantity ?? "", observation: d[id]?.observation ?? "", ...patch } }));

  const save = async () => {
    if (!meta || pending.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const usage = defaultUsageWindow(meta);
      await assignProvisional(
        requestId,
        pending.map(([id, value]) => ({
          resource_id: Number(id),
          quantity: Number(value.quantity),
          observation: value.observation.trim() || null,
          ...usage,
        })),
      );
      toast.success(`${pending.length} recurso(s) asignados de forma provisional.`);
      setDraft({});
      reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const release = async (resource: AvailableResource) => {
    setError("");
    try {
      await releaseProvisional(requestId, resource.id);
      toast.success(`«${resource.name}» liberado.`);
      reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (loading && !data) return <LoadingBlock />;
  if (loadError && !data) {
    return <ErrorState message={loadError.message} onRetry={loadError instanceof ApiError && loadError.status === 409 ? undefined : reload} />;
  }

  return (
    <div className="space-y-4">
      {meta?.pending_observations ? (
        <Alert tone="warn" title="Observaciones pendientes de la confirmación anterior">
          {meta.pending_observations}
        </Alert>
      ) : null}
      <Card>
        <div className="px-5 pt-3">
          <Tabs
            value={type}
            onChange={(value) => {
              setType(value);
              setPage(1);
              setName("");
            }}
            tabs={TYPES}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <SearchInput key={type} value={name} onChange={(value) => { setName(value); setPage(1); }} placeholder="Buscar recurso" />
        </div>
        {data && data.items.length === 0 ? (
          <EmptyState icon="box" title="Sin recursos activos de este tipo" />
        ) : (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-cream/60 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Recurso</th>
                  <th className="px-5 py-3 text-right font-medium">Disponible</th>
                  <th className="px-5 py-3 font-medium">Asignación actual</th>
                  <th className="px-5 py-3 font-medium">{type === "HUMAN" ? "Asignar" : "Cantidad requerida"}</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Observación</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data?.items ?? []).map((resource) => {
                  const row = draft[resource.id];
                  const assignment = resource.assignment;
                  const provisional = assignment?.status === "Provisional";
                  return (
                    <tr key={resource.id} className={row && Number(row.quantity) > 0 ? "bg-gold/5" : ""}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{resource.name}</p>
                        {resource.operative_role ? <p className="text-xs text-muted">{resource.operative_role}</p> : null}
                      </td>
                      <td className="px-5 py-3 text-right">{resource.available_quantity}</td>
                      <td className="px-5 py-3">
                        {assignment ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1">
                              <Badge tone={assignment.status === "Confirmada" ? "ok" : "info"}>{assignment.status}</Badge>
                              <Badge tone={assignment.sufficiency === "Suficiente" ? "ok" : "warn"}>{assignment.sufficiency}</Badge>
                            </div>
                            <p className="text-xs text-muted">
                              {assignment.assigned_quantity} de {assignment.requested_quantity}
                              {assignment.observation ? ` · “${assignment.observation}”` : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {type === "HUMAN" ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-wine"
                            aria-label={`Asignar a ${resource.name}`}
                            checked={row?.quantity === "1"}
                            disabled={resource.available_quantity < 1 && !assignment}
                            onChange={(e) => setRow(resource.id, { quantity: e.target.checked ? "1" : "" })}
                          />
                        ) : (
                          <input
                            type="number"
                            min={0}
                            step={1}
                            aria-label={`Cantidad de ${resource.name}`}
                            value={row?.quantity ?? ""}
                            placeholder={assignment ? String(assignment.requested_quantity) : "0"}
                            onChange={(e) => setRow(resource.id, { quantity: e.target.value })}
                            className="h-9 w-24 rounded-lg border border-line px-2 text-sm focus:border-gold focus:outline-none"
                          />
                        )}
                      </td>
                      <td className="hidden px-5 py-3 lg:table-cell">
                        <input
                          type="text"
                          aria-label={`Observación de ${resource.name}`}
                          value={row?.observation ?? ""}
                          onChange={(e) => setRow(resource.id, { observation: e.target.value })}
                          placeholder="Opcional"
                          className="h-9 w-full min-w-40 rounded-lg border border-line px-2 text-sm focus:border-gold focus:outline-none"
                        />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {provisional ? (
                          <Button size="sm" variant="ghost" className="text-danger" onClick={() => release(resource)}>
                            Liberar
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {data && data.items.length > 0 ? <Pagination pagination={data.pagination} onPageChange={setPage} /> : null}
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <p className="text-sm text-muted">
          {pending.length ? `${pending.length} recurso(s) por guardar` : "Captura cantidades y guarda; después confirma la asignación."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
            Descartar provisionales
          </Button>
          <Button variant="secondary" icon="check" onClick={save} loading={busy} disabled={pending.length === 0}>
            Guardar provisional
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={pending.length > 0}>
            Confirmar recursos
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        requestId={requestId}
        onConfirmed={(res) => {
          setResult(res);
          onChanged();
        }}
        onConflict={reload}
      />
      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Descartar asignaciones provisionales"
        confirmLabel="Descartar"
        tone="danger"
        onConfirm={async () => {
          const res = await cancelProvisional(requestId);
          toast.success(res.message ?? `Se liberaron ${res.provisional_resources_released} recurso(s).`);
          setDraft({});
          reload();
        }}
      >
        <p>Se liberarán todos los recursos asignados de forma provisional a esta solicitud.</p>
      </ConfirmDialog>
      {result ? (
        <Modal open onClose={() => setResult(null)} title="Recursos confirmados" size="sm">
          <div className="space-y-3 text-sm">
            <Alert tone={result.is_fully_sufficient ? "ok" : "warn"} title={result.current_status}>
              {result.summary.sufficient_resources} suficiente(s) · {result.summary.insufficient_resources} insuficiente(s)
            </Alert>
            <p className="text-muted">Confirmado por {result.confirmed_by}.</p>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ConfirmModal({
  open,
  onClose,
  requestId,
  onConfirmed,
  onConflict,
}: {
  open: boolean;
  onClose: () => void;
  requestId: number;
  onConfirmed: (result: ConfirmationResult) => void;
  onConflict: () => void;
}) {
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await confirmResources(requestId, observations.trim() || null);
      setObservations("");
      onClose();
      onConfirmed(result);
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status === 409) onConflict();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Confirmar recursos"
      description="Las asignaciones provisionales quedarán confirmadas. Si algún recurso es insuficiente, la solicitud pasará a Coordinación incompleta."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy}>
            Confirmar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextAreaField label="Observaciones (opcional)" rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}
