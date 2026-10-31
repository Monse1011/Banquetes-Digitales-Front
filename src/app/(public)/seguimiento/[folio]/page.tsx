"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { StatusTimeline } from "@/components/public/status-timeline";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { canOpenProposal, getTracking, isPdfOnly, proposalPdfUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/http";
import { formatDateTime, formatLongDate } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { clientStatusLabel, normalizeStatus } from "@/lib/status";
import { DocumentTitle } from "@/components/ui/layout";
import { FOLIO_REGEX, normalizeFolio } from "@/lib/validation";

const NEXT_STEP: Record<string, string> = {
  PENDING: "Estamos revisando tu solicitud. Te avisaremos en cuanto sea aprobada.",
  APPROVED: "Tu solicitud fue aprobada y en breve se asignará a un coordinador.",
  ASSIGNED: "Un coordinador está revisando disponibilidad de personal y recursos.",
  COORDINATION_READY: "Tu coordinador te contactará para afinar los detalles antes de enviarte la propuesta.",
  COORDINATION_INCOMPLETE: "Tu coordinador te contactará para afinar los detalles antes de enviarte la propuesta.",
  PROPOSAL_GENERATED: "¡Tu propuesta está lista! Revísala para aceptarla o solicitar ajustes.",
  IN_REVIEW: "Tu propuesta está esperando tu respuesta.",
  ADJUSTMENTS_REQUESTED: "Recibimos tus comentarios. Tu coordinador preparará una nueva versión de la propuesta.",
  CONFIRMED: "¡Tu evento está confirmado! Puedes descargar tu propuesta aceptada.",
  FINALIZED: "Gracias por celebrar con nosotros.",
};

export default function TrackingPage() {
  const folio = normalizeFolio(decodeURIComponent(useParams<{ folio: string }>().folio));
  const valid = FOLIO_REGEX.test(folio);
  const { data, error, loading, reload } = useQuery(() => getTracking(folio), folio, valid);

  if (!valid) {
    return (
      <Wrapper>
        <Alert tone="danger" title="Folio inválido">
          El folio debe tener el formato BD-AAAA-00000.{" "}
          <Link href="/seguimiento" className="underline">
            Intentar de nuevo
          </Link>
        </Alert>
      </Wrapper>
    );
  }

  if (loading && !data) return <LoadingBlock label="Consultando tu solicitud…" />;

  if (error) {
    const rateLimited = error instanceof ApiError && error.status === 429;
    return (
      <Wrapper>
        <Alert
          tone={rateLimited ? "warn" : "danger"}
          title={rateLimited ? "Demasiadas consultas" : "No encontramos tu solicitud"}
          action={rateLimited ? <Button variant="secondary" size="sm" onClick={reload}>Reintentar</Button> : undefined}
        >
          {error.message}
        </Alert>
        <div className="mt-6 text-center">
          <ButtonLink href={`/seguimiento?folio=${folio}`} variant="secondary">
            Consultar otro folio
          </ButtonLink>
        </div>
      </Wrapper>
    );
  }

  if (!data) return null;
  const status = normalizeStatus(data.status) ?? data.status;
  const interactive = canOpenProposal(data.proposal_access);
  const pdfOnly = isPdfOnly(data.proposal_access);

  return (
    <Wrapper>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Folio</p>
          <p className="font-mono text-2xl font-semibold text-wine">{data.folio}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Estado</p>
          <p className="font-display text-xl font-semibold">{clientStatusLabel(data.status)}</p>
          <p className="text-xs text-muted">Actualizado {formatDateTime(data.status_changed_at)}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <StatusTimeline status={data.status} />
        {NEXT_STEP[status] ? <p className="mt-6 text-center text-sm text-muted">{NEXT_STEP[status]}</p> : null}
      </div>

      {interactive || pdfOnly ? (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon name="file" className="mt-0.5 h-6 w-6 text-gold" />
            <div>
              <p className="font-semibold">{pdfOnly ? "Propuesta aceptada" : "Propuesta disponible"}</p>
              <p className="text-sm text-muted">
                {pdfOnly ? "Consulta o descarga el documento definitivo de tu evento." : "Revisa el detalle y responde desde aquí."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {interactive ? (
              <ButtonLink href={`/seguimiento/${data.folio}/propuesta`} icon="eye">
                Ver propuesta
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href={proposalPdfUrl(data.folio)} icon="eye" external>
                  Ver PDF
                </ButtonLink>
                <ButtonLink href={proposalPdfUrl(data.folio, true)} variant="secondary" icon="download" external>
                  Descargar
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      ) : null}

      <dl className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-6 text-sm shadow-sm sm:grid-cols-2">
        <Info icon="user" label="A nombre de" value={data.client_name} />
        <Info icon="calendar" label="Fecha del evento" value={formatLongDate(data.event_date)} />
        <Info icon="pin" label="Lugar" value={data.event_address} />
        <Info icon="users" label="Invitados" value={String(data.guest_count)} />
      </dl>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <DocumentTitle title="Seguimiento de solicitud" />
      {children}
    </div>
  );
}

// dt/dd deben ser hijos directos del div de cada par; el ícono va como fondo del par.
function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="relative pl-8">
      <Icon name={icon} className="absolute left-0 top-0.5 h-5 w-5 text-gold" />
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 first-letter:uppercase">{value}</dd>
    </div>
  );
}
