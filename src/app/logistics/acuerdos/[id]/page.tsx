"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  agreementError,
  isAgreementRevisionConflict,
  getAgreements,
  meridaInput,
  saveAgreements,
  type Agreement,
  type AgreementValues,
} from "@/lib/api/agreements";
import { resourceLabel } from "@/lib/api/resources";
import { useAuth } from "@/lib/auth/auth-context";
import { generateProposal } from "@/lib/api/proposals";
const inputClass =
  "mt-1 block w-full rounded border border-[#D4BFC2] bg-white p-3";
export default function AgreementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const router = useRouter();
  const [savedValues, setSavedValues] = useState("");
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [agreement, setAgreement] = useState<Agreement>();
  const [values, setValues] = useState<AgreementValues>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [stale, setStale] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    getAgreements(id, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setAgreement(data);
        setAgreementId(data.derived_information_id);
        const initialValues = {
          location: data.location,
          start: meridaInput(data.start_datetime),
          end: meridaInput(data.end_datetime),
          observations: data.observations ?? "",
          quantities: Object.fromEntries(
            data.assigned_resources.map((r) => [r.resource_id, r.quantity]),
          ),
        };
        setValues(initialValues);
        setSavedValues(JSON.stringify(initialValues));
        setStale(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(agreementError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, refresh]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!values || !agreement || lock.current || stale) return;
    setError("");
    setNotice("");
    if (values.end <= values.start) {
      setError("La fecha y hora de fin deben ser posteriores al inicio.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const saved = await saveAgreements(
        id,
        values,
        agreement.assigned_resources,
        agreementId,
      );
      setAgreementId(saved.data.derived_information_id);
      setSavedValues(JSON.stringify(values));
      setAgreement({
        ...agreement,
        derived_information_id: saved.data.derived_information_id,
        assigned_resources: agreement.assigned_resources.map((resource) => ({
          ...resource,
          quantity: values.quantities[resource.resource_id],
        })),
      });
      setNotice(
        "Acuerdos guardados correctamente. El estado de la solicitud se conserva.",
      );
    } catch (e) {
      setError(agreementError(e));
      if (isAgreementRevisionConflict(e)) setStale(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const dirty = values ? JSON.stringify(values) !== savedValues : false;
  async function generate() {
    if (!agreementId || dirty || lock.current || stale) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await generateProposal(id, agreementId);
      router.push(`/logistics/propuesta/${id}`);
    } catch (e) {
      setError(agreementError(e));
      if (isAgreementRevisionConflict(e)) setStale(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="p-8 text-[#5A3A3E]">
      <section className="mx-auto max-w-6xl space-y-5">
        <Link href={isAdmin ? "/admin" : "/logistics"} className="underline">
          {isAdmin ? "Volver a solicitudes" : "Volver a Mis Eventos"}
        </Link>
        <h1 className="font-display text-3xl text-[#2C1A1D]">
          Registrar acuerdos con el cliente
        </h1>
        {error && (
          <p
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded bg-green-50 p-4 text-green-800">
            {notice}
          </p>
        )}
        {stale && (
          <div className="space-y-2">
            <p>
              Al actualizar se cargarán los últimos acuerdos guardados y se
              reemplazarán los cambios de este formulario.
            </p>
            <button
              type="button"
              disabled={loading || busy}
              className="underline disabled:opacity-50"
              onClick={() => {
                setError("");
                setNotice("");
                setLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              {loading ? "Actualizando…" : "Actualizar acuerdos"}
            </button>
          </div>
        )}
        {loading ? (
          <p>Cargando acuerdos…</p>
        ) : !agreement ? (
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              setRefresh((v) => v + 1);
            }}
          >
            Reintentar
          </button>
        ) : (
          values && (
            <>
              <section className="rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
                <h2 className="font-display text-xl">
                  {agreement.folio} · {agreement.status}
                </h2>
                <p>{agreement.client.client_name}</p>
                <p>
                  {agreement.client.client_email} ·{" "}
                  {agreement.client.client_phone}
                </p>
              </section>
              {!agreement.can_register_agreements && (
                <p>
                  El estado actual permite consultar los acuerdos, pero no
                  editarlos.
                </p>
              )}
              <form onSubmit={submit}>
                <fieldset
                  disabled={busy || stale || !agreement.can_register_agreements}
                  className="space-y-6"
                >
                  <section className="space-y-4 rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
                    <h2 className="font-display text-xl">
                      Lugar y horario acordados
                    </h2>
                    <label className="block">
                      Ubicación
                      <input
                        className={inputClass}
                        required
                        maxLength={255}
                        value={values.location}
                        onChange={(e) =>
                          setValues({ ...values, location: e.target.value })
                        }
                      />
                    </label>
                    <p className="text-sm">
                      Horario de Mérida. Puedes elegir una fecha de fin distinta
                      si el evento termina al día siguiente.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label>
                        Inicio
                        <input
                          type="datetime-local"
                          required
                          className={inputClass}
                          value={values.start}
                          onChange={(e) =>
                            setValues({ ...values, start: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Fin
                        <input
                          type="datetime-local"
                          required
                          className={inputClass}
                          value={values.end}
                          onChange={(e) =>
                            setValues({ ...values, end: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  </section>
                  <section className="rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
                    <h2 className="font-display text-xl">Recursos revisados</h2>
                    <p className="my-3 text-sm">
                      Ajusta las cantidades acordadas. La disponibilidad para el
                      nuevo horario se valida al guardar.
                    </p>
                    <p className="my-3 text-sm">
                      La cantidad solicitada, la disponibilidad y las notas
                      corresponden a la revisión de recursos. La cantidad
                      asignada refleja el último ajuste guardado.
                    </p>
                    {agreement.confirmation_observations && (
                      <div className="my-3 rounded bg-[#F4EBE7] p-3">
                        <p className="font-semibold">
                          Observaciones de la confirmación de recursos
                        </p>
                        <p className="whitespace-pre-wrap">
                          {agreement.confirmation_observations}
                        </p>
                      </div>
                    )}
                    {agreement.assigned_resources.some(
                      (r) => r.type === "HUMAN",
                    ) && (
                      <p className="my-3 text-sm">
                        Selecciona las personas ya confirmadas que participarán
                        en el acuerdo. Al desmarcar una persona, su cantidad
                        acordada será 0 al guardar. Aquí solo puedes ajustar el
                        personal previamente confirmado.
                      </p>
                    )}
                    {!agreement.assigned_resources.length ? (
                      <p role="status">
                        No hay recursos confirmados disponibles para esta
                        solicitud. Revisa la confirmación de recursos antes de
                        guardar los acuerdos.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr>
                              <th className="p-3">Recurso</th>
                              <th>Tipo</th>
                              <th>Cantidad solicitada</th>
                              <th>Disponible al confirmar</th>
                              <th>Cantidad asignada</th>
                              <th>Cantidad acordada</th>
                              <th>Revisión y observaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agreement.assigned_resources.map((r) => (
                              <tr
                                key={r.resource_id}
                                className="border-t border-[#E8D8DB]"
                              >
                                <td className="p-3">{r.name}</td>
                                <td>{resourceLabel[r.type]}</td>
                                <td>{r.requested_quantity ?? "Sin dato"}</td>
                                <td>{r.available_quantity ?? "Sin dato"}</td>
                                <td>{r.quantity}</td>
                                <td>
                                  {r.type === "HUMAN" ? (
                                    <label className="my-2 flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={
                                          values.quantities[r.resource_id] === 1
                                        }
                                        onChange={(e) =>
                                          setValues({
                                            ...values,
                                            quantities: {
                                              ...values.quantities,
                                              [r.resource_id]: e.target.checked
                                                ? 1
                                                : 0,
                                            },
                                          })
                                        }
                                        aria-label={`Incluir a ${r.name} en el acuerdo`}
                                        className="accent-[#6B2737]"
                                      />
                                      {values.quantities[r.resource_id] === 1
                                        ? "Incluida (1)"
                                        : "No incluida (0)"}
                                    </label>
                                  ) : (
                                    <input
                                      aria-label={`Cantidad acordada de ${r.name}`}
                                      className="my-2 w-24 rounded border p-2"
                                      type="number"
                                      required
                                      min="0"
                                      step="1"
                                      value={values.quantities[r.resource_id]}
                                      onChange={(e) =>
                                        setValues({
                                          ...values,
                                          quantities: {
                                            ...values.quantities,
                                            [r.resource_id]:
                                              e.target.valueAsNumber,
                                          },
                                        })
                                      }
                                    />
                                  )}
                                </td>
                                <td className="min-w-48 p-3">
                                  {r.sufficiency && <p>{r.sufficiency}</p>}
                                  <p className="whitespace-pre-wrap">
                                    {r.observation || "Sin observaciones"}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                  <label className="block">
                    Observaciones
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={values.observations}
                      onChange={(e) =>
                        setValues({ ...values, observations: e.target.value })
                      }
                    />
                  </label>
                  <button
                    className="rounded bg-[#6B2737] px-6 py-3 text-white disabled:opacity-50"
                    disabled={busy || !agreement.assigned_resources.length}
                  >
                    {busy ? "Guardando…" : "Guardar acuerdos"}
                  </button>
                  {dirty && (
                    <p>Guarda los cambios antes de generar la propuesta.</p>
                  )}
                  <p>
                    Generar crea el PDF definitivo y cambia el estado a
                    «Propuesta generada».
                  </p>
                  <button
                    type="button"
                    onClick={() => void generate()}
                    disabled={
                      busy ||
                      dirty ||
                      !agreementId ||
                      !agreement.assigned_resources.length
                    }
                    className="rounded bg-[#6B2737] px-6 py-3 text-white disabled:opacity-50"
                  >
                    {busy ? "Procesando…" : "Generar propuesta"}
                  </button>
                </fieldset>
              </form>
            </>
          )
        )}
      </section>
    </main>
  );
}
