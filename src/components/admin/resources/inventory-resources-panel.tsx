"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getInventory,
  listInventory,
  saveInventory,
  setInventoryActive,
  type InventoryKind,
  type InventoryRecord,
  type InventoryValues,
} from "@/lib/api/inventory-resources";
import { InventoryResourceForm } from "./inventory-resource-form";
const button =
  "rounded border border-[#D4BFC2] px-3 py-2 text-sm text-[#6B2737] disabled:opacity-50";
const message = (e: unknown) =>
  e instanceof Error ? e.message : "No fue posible completar la operación.";
const money = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    value,
  );
const date = (value?: string) =>
  !value
    ? "Sin registrar"
    : Number.isNaN(new Date(value).getTime())
      ? value
      : new Date(value).toLocaleString("es-MX");
export function InventoryResourcesPanel({ kind }: { kind: InventoryKind }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [status, setStatus] = useState<"active" | "inactive" | "all">("active");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    id?: number;
    values?: InventoryValues;
  } | null>(null);
  const [formError, setFormError] = useState("");
  const [detail, setDetail] = useState<InventoryRecord | null>(null);
  const lock = useRef(false);
  const generation = useRef(0);
  const label = kind === "material" ? "materiales" : "logísticos";
  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const groups = await Promise.all(
        status === "all"
          ? [listInventory(kind, "active"), listInventory(kind, "inactive")]
          : [listInventory(kind, status)],
      );
      if (current === generation.current) setRecords(groups.flat());
    } catch (e) {
      if (current === generation.current) {
        setRecords([]);
        setError(message(e));
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [kind, status]);
  useEffect(() => {
    const requests = generation;
    // Synchronize loading state with the remote catalog request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.role === "admin") void load();
    return () => {
      requests.current++;
    };
  }, [load, user?.role]);
  async function inspect(row: InventoryRecord, edit = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const fresh = await getInventory(kind, row.id);
      if (edit) {
        setFormError("");
        setForm({
          id: fresh.id,
          values: {
            name: fresh.name,
            quantity: fresh.quantity,
            unit_cost: fresh.unit_cost,
          },
        });
      } else setDetail(fresh);
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function save(values: InventoryValues) {
    if (lock.current || !form) return;
    lock.current = true;
    setBusy(true);
    setFormError("");
    setSuccess("");
    try {
      await saveInventory(kind, values, form.id);
      setForm(null);
      setSuccess("Recurso guardado correctamente.");
      await load();
    } catch (e) {
      setFormError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function changeStatus(row: InventoryRecord) {
    if (
      lock.current ||
      !window.confirm(
        `¿Desea ${row.is_active ? "desactivar" : "reactivar"} el recurso ${row.name}?`,
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await setInventoryActive(kind, row.id, !row.is_active);
      setSuccess("Estado actualizado correctamente.");
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (user?.role !== "admin")
    return <p role="alert">Se requiere una sesión de Administrador General.</p>;
  const rows = records
    .filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          className={button}
          disabled={busy || loading || !!error}
          onClick={() => {
            setFormError("");
            setSuccess("");
            setForm({});
          }}
        >
          + Agregar recurso {kind === "material" ? "material" : "logístico"}
        </button>
        <button
          className={button}
          disabled={busy || loading}
          onClick={() => void load()}
        >
          Actualizar
        </button>
        <input
          aria-label="Buscar por nombre"
          placeholder="Buscar por nombre…"
          className="rounded border border-[#D4BFC2] bg-white p-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Estado del recurso"
          className="rounded border border-[#D4BFC2] bg-white p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-green-800">
          {success}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando recursos…</p>
      ) : (
        !error &&
        (rows.length === 0 ? (
          <p>No se encontraron recursos {label}.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
            <table className="w-full min-w-[900px] text-left text-sm text-[#5A3A3E]">
              <thead>
                <tr>
                  {[
                    "Identificador",
                    "Nombre",
                    "Stock",
                    "Cantidad comprometida",
                    "Costo unitario",
                    "Estado",
                    "Acciones",
                  ].map((h) => (
                    <th key={h} className="border-b p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-3">{row.id}</td>
                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className="p-3">Sin información</td>
                    <td className="p-3">{money(row.unit_cost)}</td>
                    <td className="p-3">
                      {row.is_active ? "Activo" : "Inactivo"}
                    </td>
                    <td className="flex gap-2 p-3">
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => void inspect(row)}
                      >
                        Ver detalle
                      </button>
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => void inspect(row, true)}
                      >
                        Editar
                      </button>
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => void changeStatus(row)}
                      >
                        {row.is_active ? "Desactivar" : "Reactivar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      {form && (
        <InventoryResourceForm
          kind={kind}
          initialValues={form.values}
          error={formError}
          saving={busy}
          onClose={() => {
            if (!busy) setForm(null);
          }}
          onSave={(values) => void save(values)}
        />
      )}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-detail-title"
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-auto rounded-lg bg-[#FDFAF8] p-6 text-[#5A3A3E]"
          >
            <h2 id="inventory-detail-title" className="font-display text-2xl">
              Detalle del recurso
            </h2>
            <p>Identificador: {detail.id}</p>
            <p>Tipo: {kind === "material" ? "Material" : "Logístico"}</p>
            <p>Nombre: {detail.name}</p>
            <p>Cantidad en stock: {detail.quantity}</p>
            <p>Costo unitario: {money(detail.unit_cost)}</p>
            <p>Estado: {detail.is_active ? "Activo" : "Inactivo"}</p>
            <p>Fecha de registro: {date(detail.created_at)}</p>
            <p>Última modificación: {date(detail.updated_at)}</p>
            <p>
              Eventos en curso o futuros y cantidades comprometidas: información
              no disponible.
            </p>
            <button className={button} onClick={() => setDetail(null)}>
              Cerrar
            </button>
          </section>
        </div>
      )}
    </>
  );
}
