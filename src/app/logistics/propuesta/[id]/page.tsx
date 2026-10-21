"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  downloadProposal,
  getProposal,
  sendProposal,
  type Proposal,
} from "@/lib/api/proposals";
import { getLogisticsEvent } from "@/lib/api/logistics-events";
import { confirmProposalAndSchedule } from "@/lib/api/calendar";
import { useAuth } from "@/lib/auth/auth-context";
import { agreementError } from "@/lib/api/agreements";
export default function ProposalPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const [proposal, setProposal] = useState<Proposal>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [eventStatus, setEventStatus] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const confirmationLock = useRef(false);
  const lock = useRef(false);
  const sendLock = useRef(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [recipient, setRecipient] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getProposal(id, controller.signal),
      getLogisticsEvent(id, controller.signal, isAdmin),
    ])
      .then(([p, event]) => {
        if (!controller.signal.aborted) {
          setProposal(p);
          setRecipient(event.client_email);
          setEventStatus(event.status);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(agreementError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, refresh, isAdmin]);
  async function download() {
    if (!proposal || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const blob = await downloadProposal(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = proposal.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(agreementError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function send() {
    if (!proposal || !recipient || sendLock.current || sent) return;
    sendLock.current = true;
    setSending(true);
    setError("");
    try {
      await sendProposal(id);
      setSent(true);
    } catch (e) {
      setError(agreementError(e));
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }
  async function confirm() {
    if (
      !accepted ||
      confirmationLock.current ||
      eventStatus !== "PROPOSAL_GENERATED"
    )
      return;
    confirmationLock.current = true;
    setConfirming(true);
    setError("");
    try {
      await confirmProposalAndSchedule(id);
      setConfirmed(true);
      setEventStatus("CONFIRMED");
      setProposal((previous) =>
        previous ? { ...previous, status: "accepted" } : previous,
      );
    } catch (e) {
      setError(
        `${agreementError(e)} Revisa el estado y la disponibilidad en el calendario antes de reintentar. Si hay un conflicto, resuélvelo primero.`,
      );
    } finally {
      confirmationLock.current = false;
      setConfirming(false);
    }
  }
  return (
    <main className="p-8 text-[#5A3A3E]">
      <section className="mx-auto max-w-4xl space-y-5">
        <Link href={isAdmin ? "/admin" : "/logistics"} className="underline">
          {isAdmin ? "Volver a solicitudes" : "Volver a Mis Eventos"}
        </Link>
        <h1 className="font-display text-3xl text-[#2C1A1D]">
          Propuesta del evento
        </h1>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p>Cargando propuesta…</p>
        ) : proposal ? (
          <section className="space-y-4 rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
            <h2 className="font-display text-2xl">{proposal.proposals_code}</h2>
            <p>
              Estado:{" "}
              {(
                {
                  in_review: "En revisión",
                  draft: "Borrador",
                  accepted: "Aceptada",
                  rejected: "Rechazada",
                } as Record<string, string>
              )[proposal.status] ?? proposal.status}
            </p>
            <p>Fecha de creación: {proposal.creation_date}</p>
            <p className="break-all">Archivo: {proposal.name}</p>
            <p>La propuesta generada conserva el documento original.</p>
            <button
              disabled={busy}
              onClick={() => void download()}
              className="rounded bg-[#6B2737] px-6 py-3 text-white disabled:opacity-50"
            >
              {busy ? "Descargando…" : "Descargar PDF"}
            </button>
            {!isAdmin && (
              <div className="space-y-3 border-t border-[#E8D8DB] pt-4">
                <p>
                  Enviar este PDF al correo registrado del cliente:{" "}
                  <strong>{recipient ?? "Sin correo registrado"}</strong>.
                </p>
                {sent ? (
                  <p role="status" className="text-green-800">
                    Propuesta enviada a {recipient}.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={sending || !recipient}
                    onClick={() => void send()}
                    className="rounded bg-[#6B2737] px-6 py-3 text-white disabled:opacity-50"
                  >
                    {sending
                      ? "Enviando propuesta…"
                      : "Enviar propuesta al cliente"}
                  </button>
                )}
              </div>
            )}
            <div className="space-y-3 border-t border-[#E8D8DB] pt-4">
              {eventStatus === "PROPOSAL_GENERATED" ? (
                <>
                  <h2 className="font-display text-xl">
                    Aceptación del cliente
                  </h2>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={accepted}
                      disabled={confirming}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    El cliente aceptó esta propuesta y sus acuerdos.
                  </label>
                  <button
                    type="button"
                    disabled={!accepted || confirming || sending}
                    onClick={() => void confirm()}
                    className="rounded bg-[#6B2737] px-6 py-3 text-white disabled:opacity-50"
                  >
                    {confirming
                      ? "Confirmando evento…"
                      : "Confirmar y agendar evento"}
                  </button>
                </>
              ) : ["CONFIRMED", "COMPLETED"].includes(eventStatus) ? (
                <>
                  {confirmed && (
                    <p role="status">
                      Propuesta aceptada. Evento guardado en calendario.
                    </p>
                  )}
                  <Link
                    className="underline"
                    href={`${isAdmin ? "/admin" : "/logistics"}/calendario?request=${id}`}
                  >
                    Ver evento en calendario
                  </Link>
                </>
              ) : null}
            </div>
          </section>
        ) : (
          <>
            <button
              onClick={() => {
                setLoading(true);
                setError("");
                setRefresh((v) => v + 1);
              }}
            >
              Reintentar consulta
            </button>
            <Link className="ml-4 underline" href={`/logistics/acuerdos/${id}`}>
              Volver a acuerdos
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
