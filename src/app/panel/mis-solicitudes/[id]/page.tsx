"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { SyncBadge } from "@/components/backstage/calendar-view";
import { BackLink, ErrorState } from "@/components/backstage/common";
import { Forbidden, RequirePermission } from "@/components/backstage/shell";
import { AgreementsTab } from "@/components/logistics/agreements-tab";
import { ProposalTab } from "@/components/logistics/proposal-tab";
import { ResourcesTab } from "@/components/logistics/resources-tab";
import { SummaryTab } from "@/components/logistics/summary-tab";
import { StatusTimeline } from "@/components/public/status-timeline";
import { Button } from "@/components/ui/button";
import { Alert, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { Card, PageHeader, Tabs } from "@/components/ui/layout";
import { useToast } from "@/components/ui/toast";
import { listCalendarEvents } from "@/lib/api/calendar";
import { ApiError, errorMessage } from "@/lib/api/http";
import { getAssignedRequest, scheduleEvent, type AssignedRequestDetail } from "@/lib/api/logistics";
import { formatDate, formatTime } from "@/lib/format";
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
    </>
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
          <div className="flex items-center gap-3">
            <SyncBadge status={event.sync_status} />
            <Link href="/panel/calendario" className="text-sm text-wine hover:underline">
              Ver en calendario
            </Link>
          </div>
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
