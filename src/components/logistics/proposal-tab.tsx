"use client";

import { useState } from "react";
import { ErrorState } from "@/components/backstage/common";
import { Button } from "@/components/ui/button";
import { Alert, Badge, LoadingBlock } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form";
import { Card, CardHeader, DetailList } from "@/components/ui/layout";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage, saveBlob } from "@/lib/api/http";
import {
  downloadProposal,
  generateProposal,
  getAgreements,
  getGeneratedProposal,
  sendProposal,
  type AssignedRequestDetail,
} from "@/lib/api/logistics";
import { formatDate, formatMoney } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { canEditAgreements } from "@/lib/status";

const PROPOSAL_STATUS: Record<string, { label: string; tone: "info" | "ok" | "warn" | "danger" | "neutral" }> = {
  in_review: { label: "En revisión del cliente", tone: "info" },
  accepted: { label: "Aceptada", tone: "ok" },
  adjustments_requested: { label: "Ajustes solicitados", tone: "warn" },
  rejected: { label: "Rechazada", tone: "danger" },
  draft: { label: "Borrador", tone: "neutral" },
};

async function loadProposal(requestId: number) {
  try {
    return await getGeneratedProposal(requestId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function ProposalTab({ detail, onChanged }: { detail: AssignedRequestDetail; onChanged: () => void }) {
  const toast = useToast();
  const requestId = detail.request_id;
  const proposal = useQuery(() => loadProposal(requestId), `proposal-${requestId}-${detail.status}`);
  const canGenerate = canEditAgreements(detail.status);
  const agreements = useQuery(() => getAgreements(requestId), `agreements-${requestId}-${detail.status}`, canGenerate);
  const [sendOpen, setSendOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await downloadProposal(requestId);
      saveBlob(blob, filename ?? proposal.data?.name ?? "propuesta.pdf");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (proposal.loading && proposal.data === undefined) return <LoadingBlock />;
  if (proposal.error) return <ErrorState message={proposal.error.message} onRetry={proposal.reload} />;

  const current = proposal.data;
  const status = current ? (PROPOSAL_STATUS[current.status.toLowerCase()] ?? { label: current.status, tone: "neutral" as const }) : null;

  return (
    <div className="space-y-6">
      {current ? (
        <Card>
          <CardHeader
            title={`Propuesta ${current.proposals_code}`}
            description={status ? <Badge tone={status.tone}>{status.label}</Badge> : undefined}
            actions={
              <>
                <Button variant="secondary" icon="download" onClick={download} loading={downloading}>
                  Descargar PDF
                </Button>
                {current.status.toLowerCase() === "in_review" ? (
                  <Button icon="send" onClick={() => setSendOpen(true)}>
                    Enviar al cliente
                  </Button>
                ) : null}
              </>
            }
          />
          <div className="p-5">
            <DetailList
              items={[
                { label: "Archivo", value: <span className="[overflow-wrap:anywhere]">{current.name}</span> },
                { label: "Generada", value: formatDate(current.creation_date) },
                ...(current.version ? [{ label: "Versión", value: current.version }] : []),
              ]}
            />
          </div>
        </Card>
      ) : !canGenerate ? (
        <Alert tone="info">La propuesta se genera después de confirmar recursos y registrar los acuerdos con el cliente.</Alert>
      ) : null}

      {canGenerate ? (
        agreements.loading && !agreements.data ? (
          <LoadingBlock />
        ) : agreements.data?.derived_information_id ? (
          <GenerateForm
            requestId={requestId}
            derivedId={agreements.data.derived_information_id}
            subtotal={agreements.data.assigned_resources.reduce((s, r) => s + r.quantity * Number(r.unit_cost ?? 0), 0)}
            isNewVersion={Boolean(current)}
            onGenerated={() => {
              proposal.reload();
              onChanged();
            }}
          />
        ) : (
          <Alert tone="warn">Registra primero los acuerdos con el cliente para poder generar la propuesta.</Alert>
        )
      ) : null}

      <ConfirmDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Enviar propuesta al cliente"
        confirmLabel="Enviar"
        onConfirm={async () => {
          await sendProposal(requestId);
          toast.success(`Propuesta enviada a ${detail.client.client_email}.`);
        }}
      >
        <p>
          Se enviará el PDF y el enlace de seguimiento a <strong>{detail.client.client_email}</strong>.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function GenerateForm({
  requestId,
  derivedId,
  subtotal,
  isNewVersion,
  onGenerated,
}: {
  requestId: number;
  derivedId: number;
  subtotal: number;
  isNewVersion: boolean;
  onGenerated: () => void;
}) {
  const toast = useToast();
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const discountValue = Number(discount || 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (Number.isNaN(discountValue) || discountValue < 0) {
      setFieldError("El descuento debe ser un número mayor o igual a cero.");
      return;
    }
    if (discountValue > subtotal) {
      setFieldError("El descuento no puede ser mayor al subtotal.");
      return;
    }
    setFieldError("");
    setBusy(true);
    try {
      const generated = await generateProposal(requestId, {
        derived_information_id: derivedId,
        client_observations: notes.trim() || null,
        discount_amount: discountValue,
      });
      toast.success(`Propuesta ${generated.proposals_code} generada.`);
      setBusy(false);
      onGenerated();
    } catch (err) {
      setBusy(false);
      setError(errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader
        title={isNewVersion ? "Generar nueva versión" : "Generar propuesta"}
        description={`Con base en la revisión de acuerdos #${derivedId}.`}
      />
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Subtotal</p>
            <p className="mt-1 text-lg font-medium">{formatMoney(subtotal)}</p>
          </div>
          <TextField
            label="Descuento (MXN)"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            error={fieldError}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Total</p>
            <p className="mt-1 font-display text-2xl text-wine">{formatMoney(Math.max(0, subtotal - (discountValue || 0)))}</p>
          </div>
        </div>
        <TextAreaField label="Observaciones para el cliente (opcional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex justify-end">
          <Button type="submit" icon="file" loading={busy}>
            Generar PDF
          </Button>
        </div>
      </form>
    </Card>
  );
}
