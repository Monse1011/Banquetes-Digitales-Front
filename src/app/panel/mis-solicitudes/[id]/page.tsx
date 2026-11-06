"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BackLink, ErrorState } from "@/components/backstage/common";
import { Forbidden, RequirePermission } from "@/components/backstage/shell";
import { AgreementsTab } from "@/components/logistics/agreements-tab";
import { ProposalTab } from "@/components/logistics/proposal-tab";
import { ResourcesTab } from "@/components/logistics/resources-tab";
import { SummaryTab } from "@/components/logistics/summary-tab";
import { StatusTimeline } from "@/components/public/status-timeline";
import { Button } from "@/components/ui/button";
import { Alert, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form";
import { Card, PageHeader, Tabs } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { listCalendarEvents } from "@/lib/api/calendar";
import { ApiError, errorMessage } from "@/lib/api/http";
import { finalizeEvent, getAssignedRequest, scheduleEvent, type AssignedRequestDetail } from "@/lib/api/logistics";
import { addDays, endsNextDay, formatDate, formatTime, toMeridaDateTime } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { canConfirmResources, canEditAgreements, isProposalVisible, normalizeStatus } from "@/lib/status";

type Tab = "summary" | "resources" | "agreements" | "proposal";

function defaultTab(status: string): Tab {
  if (canConfirmResources(status)) return "resources";
  if (canEditAgreements(status)) return "agreements";
  if (isProposalVisible(status)) return "proposal";
  return "summary";
}

function AssignedRequest() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useQuery(() => getAssignedRequest(id), id);
  const [tab, setTab] = useState<Tab | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  if (loading && !data) return <LoadingBlock />;
  if (error && !data) {
    if (error instanceof ApiError && error.status === 403) {
      return <Forbidden message="No eres el responsable asignado a esta solicitud." />;
    }
    return (
      <>
        <BackLink href="/panel/mis-solicitudes">Mis solicitudes</BackLink>
        <ErrorState message={error.message} onRetry={reload} />
      </>
    );
  }
  if (!data) return null;

  const active = tab ?? defaultTab(data.status);
  const status = normalizeStatus(data.status);
  const agreementsEnabled = canEditAgreements(data.status) || isProposalVisible(data.status);

  return (
    <>
      <PageHeader
        back={<BackLink href="/panel/mis-solicitudes">Mis solicitudes</BackLink>}
        title={data.folio}
        actions={
          data.can_register_finalization ? (
            <Button icon="check" onClick={() => setFinalizing(true)}>
              Registrar finalización
            </Button>
          ) : null
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.status} />
            <span>
              {data.client.client_name} · {formatDate(data.event_date)} · {formatTime(data.start_time)}–{formatTime(data.end_time)} h
            </span>
          </span>
        }
      />
      <div className="space-y-6">
        <Card className="p-5">
          <StatusTimeline status={data.status} clientFacing={false} />
        </Card>

        {status === "CONFIRMED" || status === "FINALIZED" ? <EventCard detail={data} /> : null}
        {status === "ADJUSTMENTS_REQUESTED" ? (
          <Alert tone="warn" title="El cliente pidió ajustes">
            Revisa sus comentarios, registra los nuevos acuerdos y genera una nueva versión de la propuesta.
          </Alert>
        ) : null}

        <Tabs<Tab>
          value={active}
          onChange={setTab}
          tabs={[
            { value: "summary", label: "Resumen" },
            { value: "resources", label: "Recursos", disabled: !canConfirmResources(data.status) },
            { value: "agreements", label: "Acuerdos", disabled: !agreementsEnabled },
            { value: "proposal", label: "Propuesta", disabled: !agreementsEnabled },
          ]}
        />

        {active === "summary" ? <SummaryTab detail={data} /> : null}
        {active === "resources" && canConfirmResources(data.status) ? (
          <ResourcesTab
            requestId={data.request_id}
            onChanged={() => {
              setTab(null);
              reload();
            }}
          />
        ) : null}
        {active === "agreements" ? (
          <AgreementsTab
            requestId={data.request_id}
            onChanged={() => {
              setTab("proposal");
              reload();
            }}
          />
        ) : null}
        {active === "proposal" ? <ProposalTab detail={data} onChanged={reload} /> : null}
      </div>
      {finalizing ? (
        <FinalizeModal
          detail={data}
          onClose={() => setFinalizing(false)}
          onSaved={() => {
            setFinalizing(false);
            reload();
          }}
        />
      ) : null}
    </>
  );
}

/** Registra las horas reales y cierra el evento (PATCH /ending). Las reglas (día programado, horas futuras, estado) las valida el back. */
function FinalizeModal({ detail, onClose, onSaved }: { detail: AssignedRequestDetail; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const start = formatTime(detail.start_time);
  const end = formatTime(detail.end_time);
  const [values, setValues] = useState({
    start_date: detail.event_date.slice(0, 10),
    start_time: start,
    end_date: endsNextDay(start, end) ? addDays(detail.event_date.slice(0, 10), 1) : detail.event_date.slice(0, 10),
    end_time: end,
    observation: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await finalizeEvent(detail.request_id, {
        actual_start_at: toMeridaDateTime(values.start_date, values.start_time),
        actual_end_at: toMeridaDateTime(values.end_date, values.end_time),
        event_observation: values.observation.trim() || null,
      });
      toast.success(`Evento ${detail.folio} finalizado.`);
      onSaved();
    } catch (err) {
      // 422 (no Confirmado / ya Finalizado), 409 (fuera del día programado) o 400: se muestra el mensaje del back.
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Registrar finalización ${detail.folio}`}
      description="Captura las horas reales del evento (hora de Mérida). El evento pasará a Finalizado."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="finalize-form" loading={busy}>
            Finalizar evento
          </Button>
        </>
      }
    >
      <form id="finalize-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <TextField label="Inicio real" type="date" value={values.start_date} onChange={(e) => set({ start_date: e.target.value })} required />
          <TextField label="Hora" type="time" value={values.start_time} onChange={(e) => set({ start_time: e.target.value })} required />
        </div>
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <TextField label="Fin real" type="date" value={values.end_date} onChange={(e) => set({ end_date: e.target.value })} required />
          <TextField label="Hora" type="time" value={values.end_time} onChange={(e) => set({ end_time: e.target.value })} required />
        </div>
        <TextAreaField
          label="Observaciones (opcional)"
          rows={3}
          maxLength={1000}
          value={values.observation}
          onChange={(e) => set({ observation: e.target.value })}
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

/** Evento en el calendario: se agenda solo al aceptar la propuesta; si no existe, se puede agendar manualmente. */
function EventCard({ detail }: { detail: AssignedRequestDetail }) {
  const toast = useToast();
  const events = useQuery(
    () => listCalendarEvents("logistics", { include_cancelled: true, per_page: 500 }),
    `events-${detail.request_id}`,
  );
  const [busy, setBusy] = useState(false);
  const event = events.data?.items.find((e) => e.request_id === detail.request_id);

  const schedule = async () => {
    setBusy(true);
    try {
      await scheduleEvent(detail.request_id);
      toast.success("Evento agendado en el calendario.");
      events.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (events.loading && !events.data) return null;
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      {event ? (
        <>
          <div className="text-sm">
            <p className="font-medium">Evento agendado</p>
            <p className="text-muted">
              {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}–{formatTime(event.end_datetime)} h · {event.location}
            </p>
          </div>
          <Link href="/panel/calendario" className="text-sm text-wine hover:underline">
            Ver en calendario
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm">El evento confirmado aún no está en el calendario.</p>
          <Button icon="calendar" onClick={schedule} loading={busy}>
            Agendar evento
          </Button>
        </>
      )}
    </Card>
  );
}

export default function AssignedRequestPage() {
  return (
    <RequirePermission permission="logistics.operate">
      <AssignedRequest />
    </RequirePermission>
  );
}
