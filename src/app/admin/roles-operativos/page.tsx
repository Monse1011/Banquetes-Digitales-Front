"use client";

import { useEffect, useRef, useState } from "react";
import { OperativeRolesTable } from "@/components/admin/operative-roles/operative-roles-table";
import { OperativeRoleFormModal } from "@/components/admin/operative-roles/operative-role-form-modal";
import { OperativeRoleDialog } from "@/components/admin/operative-roles/operative-role-dialog";
import type { OperativeRole, OperativeRoleFormValues } from "@/components/admin/operative-roles/operative-role-types";
import {
  deactivateOperativeRole,
  getActiveOperativeRoles,
  getOperativeRole,
  operativeRoleError,
  saveOperativeRole,
} from "@/lib/api/operative-roles";

const buttonClass = "rounded border border-[#D4BFC2] px-4 py-2 text-sm text-[#6B2737] disabled:cursor-not-allowed disabled:opacity-50";

export default function OperativeRolesPage() {
  const [roles, setRoles] = useState<OperativeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OperativeRole | null>(null);
  const [deactivating, setDeactivating] = useState<OperativeRole | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getActiveOperativeRoles(controller.signal).then((result) => {
      if (!controller.signal.aborted) setRoles(result);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setLoadError(operativeRoleError(error));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [refresh]);

  function reload() {
    setLoading(true);
    setLoadError("");
    setRefresh((value) => value + 1);
  }

  function closeDialog() {
    if (lock.current) return;
    setShowForm(false);
    setDeactivating(null);
    setModalError("");
  }

  async function openEdit(role: OperativeRole) {
    if (lock.current || loading) return;
    lock.current = true;
    setBusy(true);
    setActionError("");
    setNotice("");
    setModalError("");
    try {
      // Read the current name and status rather than editing an old list entry.
      const current = await getOperativeRole(role.id);
      if (!current.is_active) {
        setActionError("Este rol ya está desactivado. Se actualizará la lista de roles activos.");
        reload();
        return;
      }
      setEditing({ ...role, ...current });
      setShowForm(true);
    } catch (error) {
      setActionError(operativeRoleError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function save(values: OperativeRoleFormValues) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setModalError("");
    try {
      await saveOperativeRole(values, editing?.id);
      setShowForm(false);
      setNotice(editing ? "Rol operativo actualizado." : "Rol operativo creado.");
      reload();
    } catch (error) {
      // Keep the form and entered name so validation errors can be corrected.
      setModalError(operativeRoleError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function deactivate() {
    if (lock.current || !deactivating) return;
    lock.current = true;
    setBusy(true);
    setModalError("");
    try {
      await deactivateOperativeRole(deactivating.id);
      setDeactivating(null);
      setNotice("Rol desactivado. Se conservaron sus asociaciones con el personal.");
      reload();
    } catch (error) {
      setModalError(operativeRoleError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="p-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">Roles Operativos</h1>
          <p className="mt-1 text-sm text-[#7A5055]">Crea, edita y desactiva los roles del personal. Esta lista muestra los roles activos.</p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={loading || busy} className={buttonClass} onClick={() => {
            setEditing(null);
            setActionError("");
            setModalError("");
            setNotice("");
            setShowForm(true);
          }}>Agregar rol operativo</button>
          <button type="button" disabled={loading || busy} className={buttonClass} onClick={() => {
            setActionError("");
            reload();
          }}>{loading ? "Cargando roles…" : "Actualizar roles"}</button>
        </div>
        {notice && <p role="status" className="rounded border border-[#C8E6C9] bg-[#E8F5E9] p-3 text-sm text-[#2E7D32]">{notice}</p>}
        {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
        {loadError && <div className="rounded border border-[#E6B8B8] bg-[#FFF4F2] p-3">
          <p role="alert" className="text-red-700">No se pudo actualizar la lista: {loadError}</p>
          <button type="button" disabled={busy || loading} className="mt-2 underline" onClick={reload}>Reintentar carga</button>
        </div>}
        {!loading && !loadError && <OperativeRolesTable roles={roles} busy={busy}
          onEdit={(role) => void openEdit(role)} onDeactivate={(role) => {
            if (lock.current) return;
            setActionError("");
            setModalError("");
            setNotice("");
            setDeactivating(role);
          }} />}
        {showForm && <OperativeRoleFormModal
          key={editing?.id ?? "create"}
          mode={editing ? "edit" : "create"}
          initialValues={editing ? { name: editing.name } : undefined}
          busy={busy} error={modalError} onClose={closeDialog} onSubmit={(values) => void save(values)}
        />}
        {deactivating && <OperativeRoleDialog title="Desactivar rol operativo" busy={busy} onClose={closeDialog}>
          <div className="space-y-3 p-6 text-sm">
            <p>¿Deseas desactivar <strong>{deactivating.name}</strong>?</p>
            <p>Ya no estará disponible para nuevas selecciones. Sus asociaciones con el personal se conservarán.</p>
            <p>Personal activo asociado: {deactivating.active_human_resources_count}.</p>
            {modalError && <p role="alert" className="text-red-700">{modalError}</p>}
          </div>
          <footer className="flex justify-end gap-3 border-t border-[#E8D8DB] p-6">
            <button type="button" disabled={busy} className={buttonClass} onClick={closeDialog}>Cancelar</button>
            <button type="button" disabled={busy} className={buttonClass} onClick={() => void deactivate()}>{busy ? "Desactivando…" : "Confirmar desactivación"}</button>
          </footer>
        </OperativeRoleDialog>}
      </section>
    </main>
  );
}
