"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AssignedResourcesView } from "@/components/backstage/assigned-resources-table";
import { BackLink, ErrorState } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { StatusTimeline } from "@/components/public/status-timeline";
import { Button } from "@/components/ui/button";
import { Alert, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { SelectField } from "@/components/ui/form";
import { Card, CardHeader, DetailList, PageHeader } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  approveRequest,
  assignLogisticUser,
  getAdminRequest,
  listAvailableLogisticUsers,
  type AdminRequestDetail,
} from "@/lib/api/admin-requests";
import { ApiError, errorMessage } from "@/lib/api/http";
import { formatDateTime, formatLongDate, formatTime } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { canApprove, canReassign, normalizeStatus } from "@/lib/status";

function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data, error, loading, reload } = useQuery(() => getAdminRequest(id), id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (loading && !data) return <LoadingBlock />;
  if (error && !data) {
    return (
      <>
        <BackLink href="/panel/solicitudes">Solicitudes</BackLink>
        <ErrorState message={error.message} onRetry={error instanceof ApiError && error.status === 404 ? undefined : reload} />
      </>
    );
  }
  if (!data) return null;

  const status = normalizeStatus(data.status);
  const reassignable = canReassign(data.status) && status !== "PENDING";

  return (
    <>
      <PageHeader
        back={<BackLink href="/panel/solicitudes">Solicitudes</BackLink>}
        title={data.folio}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.status} />
            <span>Último cambio {formatDateTime(data.status_changed_at)}</span>
          </span>
        }
        actions={
          <>
            {canApprove(data.status) ? (
              <Button icon="check" onClick={() => setApproveOpen(true)}>
                Aprobar
              </Button>
            ) : null}
            {reassignable ? (
              <Button variant={data.logistic_user ? "secondary" : "primary"} icon="user" onClick={() => setAssignOpen(true)}>
                {data.logistic_user ? "Reasignar responsable" : "Asignar responsable"}
              </Button>
            ) : null}
          </>
        }
      />

      {status === "PENDING" ? (
        <div className="mb-6">
          <Alert tone="info">Aprueba la solicitud para poder asignarle un responsable de logística.</Alert>
        </div>
      ) : null}

      <div className="space-y-6">
        <Card className="p-5">
          <StatusTimeline status={data.status} clientFacing={false} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Evento" />
            <div className="p-5">
              <DetailList
                items={[
                  { label: "Fecha", value: <span className="first-letter:uppercase">{formatLongDate(data.event_date_time)}</span> },
                  { label: "Horario", value: `${formatTime(data.event_date_time)} – ${formatTime(data.event_end_time)} h` },
                  { label: "Lugar", value: data.event_address },
                  { label: "Invitados", value: data.guest_count },
                  { label: "Servicios", value: data.selected_services.join(", ") || "—" },
                  { label: "Solicitada", value: formatDateTime(data.requested_date) },
                  ...(data.actual_start_at || data.actual_end_at
                    ? [
                        { label: "Inicio real", value: formatDateTime(data.actual_start_at) },
                        { label: "Término real", value: formatDateTime(data.actual_end_at) },
                      ]
                    : []),
                ]}
              />
              {data.event_observation ? (
                <p className="mt-4 rounded-lg bg-cream p-3 text-sm">
                  <span className="font-medium">Observación del evento: </span>
                  {data.event_observation}
                </p>
              ) : null}
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader title="Cliente" />
              <div className="p-5">
                <DetailList
                  items={[
                    { label: "Nombre", value: data.client_name },
                    { label: "Correo", value: <a className="text-wine hover:underline" href={`mailto:${data.client_email}`}>{data.client_email}</a> },
                    { label: "Teléfono", value: <a className="text-wine hover:underline" href={`tel:${data.client_phone}`}>{data.client_phone}</a> },
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Responsable de logística" />
              <div className="p-5 text-sm">
                {data.logistic_user ? (
                  <>
                    <p className="font-medium">{data.logistic_user.full_name}</p>
                    <p className="text-muted">{data.logistic_user.email}</p>
                  </>
                ) : (
                  <p className="text-muted">Sin responsable asignado.</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader title="Recursos asignados" description="Consulta en solo lectura; los gestiona el responsable de logística." />
          <AssignedResourcesView assignments={data.resource_assignments} />
        </Card>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Aprobar solicitud"
        confirmLabel="Aprobar"
        onConfirm={async () => {
          await approveRequest(data.request_id);
          toast.success(`Solicitud ${data.folio} aprobada.`);
          reload();
        }}
      >
        <p>
          La solicitud <strong>{data.folio}</strong> de {data.client_name} pasará a <strong>Aprobada</strong> y podrás asignarle
          un responsable.
        </p>
      </ConfirmDialog>

      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        request={data}
        onAssigned={(name) => {
          toast.success(`Responsable asignado: ${name}.`);
          reload();
        }}
        onConflict={reload}
      />
    </>
  );
}

function AssignDialog({
  open,
  onClose,
  request,
  onAssigned,
  onConflict,
}: {
  open: boolean;
  onClose: () => void;
  request: AdminRequestDetail;
  onAssigned: (name: string) => void;
  onConflict: () => void;
}) {
  const users = useQuery(listAvailableLogisticUsers, `available-${open}`, open);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = request.logistic_user;
  const options = (users.data ?? []).filter((user) => user.id !== current?.id);

  const close = () => {
    if (busy) return;
    setUserId("");
    setError("");
    onClose();
  };

  const submit = async () => {
    const selected = options.find((user) => String(user.id) === userId);
    if (!selected) {
      setError("Selecciona un responsable.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await assignLogisticUser(request.request_id, selected.id, current?.id ?? null);
      setBusy(false);
      setUserId("");
      onClose();
      onAssigned(selected.full_name);
    } catch (err) {
      setBusy(false);
      setError(errorMessage(err));
      if (err instanceof ApiError && err.status === 409) onConflict();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={current ? "Reasignar responsable" : "Asignar responsable"}
      description={`Solicitud ${request.folio} · ${formatLongDate(request.event_date_time)}`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy} disabled={!userId}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {current ? (
          <p className="text-sm">
            Responsable actual: <strong>{current.full_name}</strong>
          </p>
        ) : null}
        {users.loading ? (
          <LoadingBlock label="Cargando personal de logística…" />
        ) : users.error ? (
          <Alert tone="danger">{users.error.message}</Alert>
        ) : options.length === 0 ? (
          <Alert tone="warn">No hay otros usuarios de logística activos disponibles.</Alert>
        ) : (
          <SelectField label="Nuevo responsable" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">Selecciona…</option>
            {options.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} · {user.employee_id}
              </option>
            ))}
          </SelectField>
        )}
        <p className="text-xs text-muted">Se valida que el responsable no tenga otro evento en el mismo horario.</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

export default function RequestDetailPage() {
  return (
    <RequirePermission permission="requests.manage">
      <RequestDetail />
    </RequirePermission>
  );
}
