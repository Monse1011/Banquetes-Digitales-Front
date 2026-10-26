"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/http";
import {
  changeResourceStatus,
  getResource,
  getResourceRoles,
  listResources,
  resourceLabel,
  saveResource,
  type Resource,
  type ResourceKind,
} from "@/lib/api/resources";

const kinds: ResourceKind[] = ["HUMAN", "MATERIAL", "LOGISTIC"];
const inputClass = "w-full rounded border border-[#D4BFC2] bg-white px-3 py-2";
const buttonClass =
  "rounded border border-[#D4BFC2] px-3 py-2 text-sm disabled:opacity-50";
export default function ResourcesPage() {
  const [type, setType] = useState<ResourceKind | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [formType, setFormType] = useState<ResourceKind>("HUMAN");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Resource | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [cost, setCost] = useState("0");
  const [duplicate, setDuplicate] = useState(false);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const statuses: ("active" | "inactive")[] =
      status === "all" ? ["active", "inactive"] : [status];
    Promise.all([
      Promise.all(
        kinds.flatMap((kind) =>
          statuses.map((s) =>
            listResources(kind, s, undefined, controller.signal),
          ),
        ),
      ),
      getResourceRoles(controller.signal),
    ])
      .then(([results, roleRows]) => {
        if (!controller.signal.aborted) {
          setResources(results.flatMap((r) => r.resources));
          setRoles(roleRows);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [status, refresh]);
  function reload() {
    setLoading(true);
    setError("");
    setRefresh((v) => v + 1);
  }
  async function perform(action: () => Promise<unknown>, message: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      reload();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function openForm(resource?: Resource) {
    setEditing(resource ?? null);
    setFormType(resource?.type ?? (type === "all" ? "HUMAN" : type));
    setName(resource?.name ?? "");
    setRole(String(resource?.operative_role_id ?? ""));
    setQuantity(String(resource?.quantity ?? 1));
    setCost(String(resource?.unit_cost ?? 0));
    setDuplicate(false);
    setConfirmedDuplicate(false);
    setError("");
    setShowForm(true);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await perform(
      async () => {
        try {
          await saveResource(
            formType,
            {
              name: name.trim(),
              ...(formType === "HUMAN"
                ? {
                    operative_role_id: Number(role),
                    confirm_duplicate: confirmedDuplicate,
                  }
                : { quantity: Number(quantity), unit_cost: Number(cost) }),
            },
            editing?.id,
          );
          setShowForm(false);
        } catch (e) {
          if (e instanceof ApiError && e.details.requires_confirmation)
            setDuplicate(true);
          throw e;
        }
      },
      editing ? "Recurso actualizado." : "Recurso creado.",
    );
  }
  const filtered = resources.filter(
    (r) =>
      (type === "all" || r.type === type) &&
      r.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const roleName = (id?: number) =>
    roles.find((r) => Number(r.id) === Number(id))?.name ??
    (id ? `Rol #${id}` : "—");
  return (
    <main className="p-8 text-[#5A3A3E]">
      <section className="mx-auto max-w-6xl space-y-5">
        <header>
          <h1 className="font-display text-3xl text-[#2C1A1D]">
            Gestión de Recursos
          </h1>
          <p>
            Administra el personal, los materiales y los recursos logísticos.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button
            className={buttonClass}
            disabled={busy}
            onClick={() => openForm()}
          >
            Agregar recurso
          </button>
          <button
            className={buttonClass}
            disabled={loading || busy}
            onClick={reload}
          >
            Actualizar recursos
          </button>
          <input
            aria-label="Buscar recurso"
            className="rounded border p-2"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Tipo de recurso"
            className={buttonClass}
            value={type}
            onChange={(e) => setType(e.target.value as ResourceKind | "all")}
          >
            <option value="all">Todos los tipos</option>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {resourceLabel[k]}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado"
            className={buttonClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setLoading(true);
              setError("");
            }}
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos los estados</option>
          </select>
        </div>
        {error && !showForm && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {loading ? (
          <p>Cargando recursos…</p>
        ) : (
          !error && (
            <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Nombre",
                      "Tipo",
                      "Rol / Cantidad",
                      "Costo unitario",
                      "Estado",
                      "Acciones",
                    ].map((h) => (
                      <th className="p-3" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-[#E8D8DB]">
                      <td className="p-3">{r.name}</td>
                      <td>{resourceLabel[r.type]}</td>
                      <td>
                        {r.type === "HUMAN"
                          ? roleName(r.operative_role_id)
                          : r.quantity}
                      </td>
                      <td>
                        {r.type === "HUMAN"
                          ? "—"
                          : r.unit_cost?.toLocaleString("es-MX", {
                              style: "currency",
                              currency: "MXN",
                            })}
                      </td>
                      <td>{r.is_active ? "Activo" : "Inactivo"}</td>
                      <td className="flex flex-wrap gap-2 p-3">
                        <button
                          className={buttonClass}
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              async () => setDetail(await getResource(r)),
                              "",
                            )
                          }
                        >
                          Ver detalle
                        </button>
                        <button
                          className={buttonClass}
                          disabled={busy}
                          onClick={() => openForm(r)}
                        >
                          Editar
                        </button>
                        <button
                          className={buttonClass}
                          disabled={busy}
                          onClick={() =>
                            void perform(
                              () => changeResourceStatus(r),
                              "Estado actualizado.",
                            )
                          }
                        >
                          {r.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="p-3">No hay recursos para estos filtros.</p>
              )}
            </div>
          )
        )}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <form
              onSubmit={submit}
              role="dialog"
              aria-modal="true"
              aria-label="Recurso"
              className="w-full max-w-lg space-y-4 rounded-lg bg-[#FDFAF8] p-6"
            >
              <h2 className="font-display text-2xl">
                {editing ? "Editar recurso" : "Agregar recurso"}
              </h2>
              {error && (
                <p role="alert" className="text-red-700">
                  {error}
                </p>
              )}
              <fieldset disabled={busy} className="space-y-4">
                <label className="block">
                  Tipo
                  <select
                    className={inputClass}
                    disabled={!!editing}
                    value={formType}
                    onChange={(e) => {
                      setFormType(e.target.value as ResourceKind);
                      setDuplicate(false);
                      setConfirmedDuplicate(false);
                    }}
                  >
                    {kinds.map((k) => (
                      <option key={k} value={k}>
                        {resourceLabel[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Nombre
                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setConfirmedDuplicate(false);
                    }}
                  />
                </label>
                {formType === "HUMAN" ? (
                  <label className="block">
                    Rol operativo
                    <select
                      required
                      className={inputClass}
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        setConfirmedDuplicate(false);
                      }}
                    >
                      <option value="">Seleccionar rol</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="block">
                      Cantidad total
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        className={inputClass}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      Costo unitario (MXN)
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className={inputClass}
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                      />
                    </label>
                  </>
                )}
                {duplicate && (
                  <label className="block">
                    <input
                      type="checkbox"
                      checked={confirmedDuplicate}
                      onChange={(e) => setConfirmedDuplicate(e.target.checked)}
                    />{" "}
                    Confirmo que deseo registrar otra persona con este nombre y
                    rol.
                  </label>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className={buttonClass}
                    disabled={duplicate && !confirmedDuplicate}
                  >
                    {busy ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        )}
        {detail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-label="Detalle del recurso"
              className="w-full max-w-lg space-y-3 rounded bg-[#FDFAF8] p-6"
            >
              <h2 className="font-display text-2xl">{detail.name}</h2>
              <p>
                {resourceLabel[detail.type]} ·{" "}
                {detail.is_active ? "Activo" : "Inactivo"}
              </p>
              {detail.type === "HUMAN" ? (
                <p>Rol: {roleName(detail.operative_role_id)}</p>
              ) : (
                <>
                  <p>Cantidad: {detail.quantity}</p>
                  <p>Costo unitario: ${detail.unit_cost}</p>
                </>
              )}
              <button className={buttonClass} onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
