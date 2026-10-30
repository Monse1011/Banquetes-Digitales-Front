"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { Checkbox, TextAreaField } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import {
  acceptProposal,
  getProposal,
  getTracking,
  isPdfOnly,
  lineAmount,
  lineName,
  proposalPdfUrl,
  rejectProposal,
  requestAdjustments,
  type ClientProposal,
  type ProposalLine,
} from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/http";
import { formatDate, formatLongDate, formatMoney, formatTime } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { clientStatusLabel } from "@/lib/status";
import { FOLIO_REGEX, normalizeFolio } from "@/lib/validation";

const MAX_OBSERVATIONS = 500;

export default function ProposalPage() {
  const folio = normalizeFolio(decodeURIComponent(useParams<{ folio: string }>().folio));
  const valid = FOLIO_REGEX.test(folio);
  const { data, error, loading, reload } = useQuery(() => getProposal(folio), folio, valid);
  const notFound = error instanceof ApiError && error.status === 404;
  // Con el evento confirmado el detalle ya no está disponible (404) pero el PDF sí.
  const tracking = useQuery(() => getTracking(folio), `${folio}-tracking`, notFound);
  const [dialog, setDialog] = useState<"accept" | "adjust" | "reject" | null>(null);
  const [result, setResult] = useState<{ tone: "ok" | "info" | "warn"; text: string } | null>(null);

  const back = (
    <Link href={`/seguimiento/${folio}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-wine">
      <Icon name="arrowLeft" className="h-4 w-4" /> Volver al seguimiento
    </Link>
  );

  if (!valid) {
    return (
      <Wrapper>
        <Alert tone="danger">Folio inválido.</Alert>
      </Wrapper>
    );
  }
  if (loading && !data) return <LoadingBlock label="Cargando tu propuesta…" />;
  if (error && !data) {
    if (notFound && tracking.loading) return <LoadingBlock label="Cargando tu propuesta…" />;
    if (notFound && isPdfOnly(tracking.data?.proposal_access)) {
      return (
        <Wrapper>
          {back}
          <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
            <Icon name="file" className="mx-auto h-10 w-10 text-gold" />
            <h1 className="font-display text-2xl font-semibold">Tu propuesta fue aceptada</h1>
            <p className="text-sm text-muted">El documento definitivo de tu evento está disponible en PDF.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href={proposalPdfUrl(folio)} icon="eye" external>
                Ver PDF
              </ButtonLink>
              <ButtonLink href={proposalPdfUrl(folio, true)} variant="secondary" icon="download" external>
                Descargar
              </ButtonLink>
            </div>
          </div>
        </Wrapper>
      );
    }
    return (
      <Wrapper>
        {back}
        <div className="mt-6">
          <Alert tone={notFound ? "info" : "danger"} title={notFound ? "Aún no hay propuesta" : "No fue posible cargar la propuesta"}>
            {notFound ? "Tu propuesta todavía no está disponible. Te avisaremos cuando esté lista." : error.message}
          </Alert>
        </div>
      </Wrapper>
    );
  }
  if (!data) return null;

  const { proposal } = data;
  const actions = new Set(data.available_actions ?? []);

  const onDone = (tone: "ok" | "info" | "warn", text: string) => {
    setResult({ tone, text });
    reload();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Wrapper>
      {back}
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Propuesta {proposal.proposals_code}</p>
          <h1 className="font-display text-3xl font-semibold">Tu propuesta de evento</h1>
          <p className="mt-1 text-sm text-muted">
            Versión {proposal.version} · Emitida el {formatDate(proposal.issue_date)} · Folio {data.folio}
          </p>
        </div>
        <StatusBadge status={data.request_status} label={clientStatusLabel(data.request_status)} />
      </header>

      {result ? (
        <div className="mt-6">
          <Alert tone={result.tone}>{result.text}</Alert>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold">Evento</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Item label="Fecha" value={formatLongDate(proposal.event.event_date)} />
              <Item label="Horario" value={`${formatTime(proposal.event.start_time)} a ${formatTime(proposal.event.end_time)} h`} />
              <Item label="Lugar" value={proposal.event.event_address} />
              <Item label="Invitados" value={String(proposal.event.guest_count)} />
              <Item label="Cliente" value={proposal.client.full_name} />
              <Item label="Contacto" value={`${proposal.client.email} · ${proposal.client.phone}`} />
            </dl>
          </section>
          <ResourceTable title="Personal" lines={proposal.resources.human} currency={proposal.currency} />
          <ResourceTable title="Material y mobiliario" lines={proposal.resources.material} currency={proposal.currency} />
          <ResourceTable title="Logística" lines={proposal.resources.logistic} currency={proposal.currency} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Totals proposal={proposal} />
          <div className="space-y-2 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <ButtonLink href={proposalPdfUrl(data.folio)} variant="secondary" icon="eye" className="w-full" external>
              Ver PDF
            </ButtonLink>
            <ButtonLink href={proposalPdfUrl(data.folio, true)} variant="secondary" icon="download" className="w-full" external>
              Descargar PDF
            </ButtonLink>
          </div>
          {actions.size > 0 ? (
            <div className="space-y-2 rounded-2xl border border-gold/40 bg-gold/10 p-5">
              <p className="text-sm font-semibold">¿Qué te pareció?</p>
              {actions.has("ACCEPT") ? (
                <Button className="w-full" icon="check" onClick={() => setDialog("accept")}>
                  Aceptar propuesta
                </Button>
              ) : null}
              {actions.has("REQUEST_ADJUSTMENTS") ? (
                <Button variant="secondary" className="w-full" icon="edit" onClick={() => setDialog("adjust")}>
                  Solicitar ajustes
                </Button>
              ) : null}
              {actions.has("REJECT") ? (
                <Button variant="ghost" className="w-full text-danger" icon="close" onClick={() => setDialog("reject")}>
                  Rechazar
                </Button>
              ) : null}
            </div>
          ) : proposal.accepted_at ? (
            <Alert tone="ok">Aceptaste esta propuesta el {formatDate(proposal.accepted_at)}.</Alert>
          ) : null}
        </aside>
      </div>

      <AcceptDialog
        open={dialog === "accept"}
        onClose={() => setDialog(null)}
        folio={data.folio}
        total={formatMoney(proposal.total_amount, proposal.currency)}
        onDone={() => onDone("ok", "¡Listo! Tu evento quedó confirmado. Ya puedes descargar tu propuesta aceptada.")}
        onConflict={reload}
      />
      <AdjustDialog
        open={dialog === "adjust"}
        onClose={() => setDialog(null)}
        folio={data.folio}
        onDone={() => onDone("info", "Enviamos tus comentarios. Tu coordinador preparará una nueva versión de la propuesta.")}
        onConflict={reload}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onClose={() => setDialog(null)}
        title="Rechazar propuesta"
        confirmLabel="Sí, rechazar"
        tone="danger"
        onConfirm={async () => {
          await rejectProposal(data.folio);
          onDone("warn", "Registramos que rechazaste la propuesta. Gracias por considerarnos.");
        }}
      >
        <p>Esta acción no se puede deshacer y liberaremos los recursos reservados para tu evento.</p>
        <p className="text-muted">Si solo quieres cambiar algo, mejor solicita ajustes.</p>
      </ConfirmDialog>
    </Wrapper>
  );
}

function AcceptDialog({
  open,
  onClose,
  folio,
  total,
  onDone,
  onConflict,
}: {
  open: boolean;
  onClose: () => void;
  folio: string;
  total: string;
  onDone: () => void;
  onConflict: () => void;
}) {
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await acceptProposal(folio);
      onClose();
      onDone();
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
      title="Aceptar propuesta"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy} disabled={!terms}>
            Confirmar evento
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p>
          Al aceptar confirmas tu evento por un total de <strong>{total}</strong>. Generaremos el documento definitivo y
          agendaremos tu fecha.
        </p>
        <Checkbox
          checked={terms}
          onChange={(event) => setTerms(event.target.checked)}
          label="He leído la propuesta y acepto los términos y condiciones del servicio."
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

function AdjustDialog({
  open,
  onClose,
  folio,
  onDone,
  onConflict,
}: {
  open: boolean;
  onClose: () => void;
  folio: string;
  onDone: () => void;
  onConflict: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const trimmed = text.trim();

  const submit = async () => {
    if (!trimmed || trimmed.length > MAX_OBSERVATIONS) {
      setError(`Describe los ajustes (de 1 a ${MAX_OBSERVATIONS} caracteres).`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await requestAdjustments(folio, trimmed);
      setText("");
      onClose();
      onDone();
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
      title="Solicitar ajustes"
      description="Cuéntanos qué te gustaría cambiar; tu coordinador preparará una nueva versión."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy}>
            Enviar comentarios
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextAreaField
          label="Ajustes"
          rows={5}
          maxLength={MAX_OBSERVATIONS}
          placeholder="Ej. Cambiar el color de la mantelería y agregar 2 meseros."
          value={text}
          onChange={(event) => setText(event.target.value)}
          hint={`${trimmed.length}/${MAX_OBSERVATIONS}`}
          required
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

function ResourceTable({ title, lines, currency }: { title: string; lines: ProposalLine[]; currency: string }) {
  if (!lines?.length) return null;
  const priced = lines.some((line) => line.unit_cost !== undefined && line.unit_cost !== null);
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">{title}</h2>
      <table className="w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-6 py-2 font-medium">Concepto</th>
            <th className="px-6 py-2 text-right font-medium">Cantidad</th>
            {priced ? <th className="hidden px-6 py-2 text-right font-medium sm:table-cell">Precio unitario</th> : null}
            {priced ? <th className="px-6 py-2 text-right font-medium">Importe</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((line, index) => (
            <tr key={`${lineName(line)}-${index}`}>
              <td className="px-6 py-3">{lineName(line)}</td>
              <td className="px-6 py-3 text-right">{line.quantity}</td>
              {priced ? (
                <td className="hidden px-6 py-3 text-right sm:table-cell">{formatMoney(line.unit_cost, currency)}</td>
              ) : null}
              {priced ? (
                <td className="px-6 py-3 text-right">{formatMoney(lineAmount(line), currency)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Totals({ proposal }: { proposal: ClientProposal }) {
  return (
    <div className="space-y-2 rounded-2xl bg-ink p-6 text-white shadow-sm">
      <Row label="Subtotal" value={formatMoney(proposal.subtotal, proposal.currency)} />
      {Number(proposal.discount_amount) > 0 ? (
        <Row label="Descuento" value={`− ${formatMoney(proposal.discount_amount, proposal.currency)}`} />
      ) : null}
      <div className="border-t border-white/15 pt-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Total</p>
        <p className="font-display text-3xl text-gold">{formatMoney(proposal.total_amount, proposal.currency)}</p>
        <p className="text-xs text-white/50">{proposal.currency}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm text-white/80">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>;
}
