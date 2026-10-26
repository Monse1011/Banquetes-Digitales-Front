"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  assignEventResource,
  cancelEventResources,
  confirmEventResources,
  listResources,
  releaseEventResource,
  resourceLabel,
  type Resource,
  type ResourceKind,
  type ResourceRequest,
} from "@/lib/api/resources";
import { confirmationOutcome } from "@/components/logistics/resource-confirmation/confirmation-outcome";
const kinds: ResourceKind[] = ["HUMAN", "MATERIAL", "LOGISTIC"];
const buttonClass =
  "rounded border border-[#D4BFC2] px-3 py-2 text-sm disabled:opacity-50";
type Draft = { quantity: string; observation: string };
export default function ResourceConfirmationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [resources, setResources] = useState<Resource[]>([]);
  const [request, setRequest] = useState<ResourceRequest>();
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const lock = useRef(false);
  const observationsLoadedFor = useRef<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      kinds.map((k) => listResources(k, "active", id, controller.signal)),
    )
      .then((results) => {
        if (controller.signal.aborted) return;
        const rows = results.flatMap((r) => r.resources);
        setResources(rows);
        setRequest(results[0].request);
        setDrafts(
          Object.fromEntries(
            rows.map((r) => [
              r.id,
              {
                quantity: String(r.assignment?.requested_quantity ?? 1),
                observation: r.assignment?.observation ?? "",
              },
            ]),
          ),
        );
        if (observationsLoadedFor.current !== id) {
          setObservations(
            results[0].request?.pending_observations ??
              results[0].request?.observations ??
              "",
          );
          observationsLoadedFor.current = id;
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, refresh]);
  function reload() {
    setError("");
    setLoading(true);
    setRefresh((v) => v + 1);
  }
  async function perform(
    action: () => Promise<unknown>,
    success: string | undefined,
    reloadAfter = true,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      setMessage(
        success ??
          (typeof result === "string" ? result : "Operación guardada."),
      );
      if (reloadAfter) reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const dirty = resources.some((r) => {
    const draft = drafts[r.id];
    return (
      draft &&
      (draft.quantity !== String(r.assignment?.requested_quantity ?? 1) ||
        draft.observation !== (r.assignment?.observation ?? ""))
    );
  });
  const hasAssignments = resources.some((r) => r.assignment);
  return (
    <main className="p-8 text-[#5A3A3E]">
      <section className="mx-auto max-w-6xl space-y-5">
        <Link className="underline" href={isAdmin ? "/admin" : "/logistics"}>
          {isAdmin ? "Volver a solicitudes" : "Volver a Mis Eventos"}
        </Link>
        <h1 className="font-display text-3xl text-[#2C1A1D]">
          Confirmación de Recursos
        </h1>
        {request && (
          <p>
            {request.folio} · {request.status}
            <br />
            {request.event_date} · {request.start_time} – {request.end_time}
          </p>
        )}
        <p>
          Selecciona las personas y cantidades necesarias. Guarda cada recurso
          antes de finalizar la confirmación.
        </p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {finished && (
          <Link
            className="inline-block underline"
            href={`/logistics/acuerdos/${id}`}
          >
            Registrar acuerdos con el cliente
          </Link>
        )}
        {!finished && (
          <button
            className={buttonClass}
            disabled={busy || loading || dirty}
            onClick={reload}
          >
            Actualizar disponibilidad
          </button>
        )}
        {loading ? (
          <p>Cargando disponibilidad…</p>
        ) : (
          !finished && (
            <>
              {kinds.map((kind) => (
                <section
                  key={kind}
                  className="rounded border border-[#E8D8DB] bg-[#FDFAF8] p-5"
                >
                  <h2 className="font-display text-xl">
                    Recursos {resourceLabel[kind]}
                  </h2>
                  {!resources.some((r) => r.type === kind) && (
                    <p className="mt-3">
                      No hay recursos activos de este tipo.
                    </p>
                  )}
                  {resources
                    .filter((r) => r.type === kind)
                    .map((r) => {
                      const draft = drafts[r.id];
                      const otherDirty = resources.some(
                        (other) =>
                          other.id !== r.id &&
                          drafts[other.id] &&
                          (drafts[other.id].quantity !==
                            String(other.assignment?.requested_quantity ?? 1) ||
                            drafts[other.id].observation !==
                              (other.assignment?.observation ?? "")),
                      );
                      return (
                        <form
                          key={r.id}
                          className="mt-4 border-t border-[#E8D8DB] pt-4"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void perform(
                              () =>
                                assignEventResource(
                                  id,
                                  r.id,
                                  Number(draft.quantity),
                                  draft.observation,
                                ),
                              "Recurso guardado.",
                            );
                          }}
                        >
                          <fieldset
                            disabled={busy || loading || otherDirty}
                            className="flex flex-wrap items-end gap-4"
                          >
                            <div className="min-w-48">
                              <h3 className="font-semibold">{r.name}</h3>
                              {r.operative_role && <p>{r.operative_role}</p>}
                              <p>Disponible: {r.available_quantity}</p>
                              {r.assignment?.sufficiency === "Insuficiente" && (
                                <p className="text-red-700">
                                  Solicitaste {r.assignment.requested_quantity};
                                  hay {r.available_quantity} disponibles para
                                  este horario. Reduce la cantidad, guarda los
                                  cambios y vuelve a confirmar.
                                </p>
                              )}
                              {r.assignment && (
                                <p>
                                  {r.assignment.sufficiency} ·{" "}
                                  {r.assignment.status} · Asignado:{" "}
                                  {r.assignment.assigned_quantity}
                                </p>
                              )}
                            </div>
                            <label>
                              Cantidad solicitada
                              <input
                                className="block w-24 rounded border p-2"
                                type="number"
                                min="1"
                                step="1"
                                max={kind === "HUMAN" ? 1 : undefined}
                                required
                                value={draft.quantity}
                                onChange={(e) =>
                                  setDrafts((v) => ({
                                    ...v,
                                    [r.id]: {
                                      ...draft,
                                      quantity: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <label className="grow">
                              Observación
                              <input
                                className="block w-full rounded border p-2"
                                value={draft.observation}
                                onChange={(e) =>
                                  setDrafts((v) => ({
                                    ...v,
                                    [r.id]: {
                                      ...draft,
                                      observation: e.target.value,
                                    },
                                  }))
                                }
                              />
                            </label>
                            <button
                              disabled={otherDirty}
                              className={buttonClass}
                            >
                              {r.assignment ? "Guardar cambios" : "Asignar"}
                            </button>
                            {r.assignment?.status === "Provisional" && (
                              <button
                                type="button"
                                disabled={otherDirty}
                                className={buttonClass}
                                onClick={() =>
                                  void perform(
                                    () => releaseEventResource(id, r.id),
                                    "Asignación provisional liberada.",
                                  )
                                }
                              >
                                Liberar
                              </button>
                            )}
                          </fieldset>
                        </form>
                      );
                    })}
                </section>
              ))}
              <label className="block">
                Observaciones generales
                <textarea
                  disabled={busy}
                  className="mt-2 block w-full rounded border p-3"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </label>
              {dirty && (
                <p>Guarda los cambios de cada recurso antes de finalizar.</p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className={buttonClass}
                  disabled={busy || !hasAssignments || dirty}
                  onClick={() =>
                    void perform(
                      async () => {
                        const result = await confirmEventResources(
                          id,
                          observations,
                        );
                        setRequest((r) =>
                          r ? { ...r, status: result.data.current_status } : r,
                        );
                        const outcome = confirmationOutcome(
                          result.data.current_status,
                        );
                        setFinished(outcome.complete);
                        if (!outcome.complete) reload();
                        return outcome.message;
                      },
                      undefined,
                      false,
                    )
                  }
                >
                  Finalizar confirmación
                </button>
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await cancelEventResources(id);
                      setObservations("");
                    }, "Asignaciones provisionales canceladas.")
                  }
                >
                  Cancelar asignaciones provisionales
                </button>
              </div>
            </>
          )
        )}
      </section>
    </main>
  );
}
