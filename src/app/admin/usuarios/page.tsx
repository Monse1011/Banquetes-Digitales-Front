"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { UserDetailModal } from "@/components/admin/users/user-detail-modal";
import { UserFormModal } from "@/components/admin/users/user-form-modal";
import { getUsers, getUser, saveUser, changeUserStatus, resendUserCredentials } from "@/lib/api/users";
import { ApiError } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/auth-context";
import { UsersFilters } from "@/components/admin/users/user-filters";
import { UsersTable } from "@/components/admin/users/users-table";

import type {
  AdminUser,
  UserFormValues,
  UserRole,
  UserStatus,
} from "@/components/admin/users/user-types";

export default function UsersPage() {
  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const { user: sessionUser } = useAuth();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function reload() {
    setLoading(true); setError("");
    try { setUsers(await getUsers()); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    getUsers().then((rows) => { if (active) setUsers(rows); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const [search, setSearch] = useState("");
  const [role, setRole] =
    useState<"all" | UserRole>("all");
  const [status, setStatus] =
    useState<"all" | UserStatus>("all");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] =
    useState<AdminUser | null>(null);

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return users.map((user) => ({ ...user, is_current_user: user.id === Number(sessionUser?.id_user) })).filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        user.full_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        user.email
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesRole =
        role === "all" || user.role === role;

      const matchesStatus =
        status === "all" || user.status === status;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, role, status, sessionUser?.id_user]);

  function handleAddUser() {
    if (busyRef.current) return;
    setEditingUser(null);
    setFormError(null);
    setShowForm(true);
  }

  function handleEditUser(user: AdminUser) {
    if (busyRef.current) return;
    setEditingUser(user);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(values: UserFormValues) {
    if (busyRef.current || !values.role) return;
    busyRef.current = true; setBusy(true); setFormError(null); setNotice("");
    try {
      const saved = await saveUser(values, editingUser?.id);
      setShowForm(false); setEditingUser(null);
      setNotice(`Usuario ${saved.employee_id} ${editingUser ? "actualizado" : "registrado"}.`);
      await reload();
    } catch(e) {
      if (e instanceof ApiError && e.status === 502) {
        setShowForm(false); setEditingUser(null); setNotice(e.message); await reload();
      } else setFormError(e instanceof Error ? e.message : "No se pudo guardar el usuario.");
    } finally { busyRef.current = false; setBusy(false); }
  }
  async function handleChangeStatus(user: AdminUser) {
    if (busyRef.current || user.is_current_user) return;
    busyRef.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await changeUserStatus(user.id, user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      setNotice("Estado actualizado."); await reload();
    } catch(e) { setError(e instanceof Error ? e.message : "No se pudo cambiar el estado."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function handleView(user: AdminUser) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { setSelectedUser(await getUser(user.id)); }
    catch(e) { setError(e instanceof Error ? e.message : "No se pudo cargar el detalle."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function handleResend() {
    if (!selectedUser || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { await resendUserCredentials(selectedUser.id); setNotice("Credenciales reenviadas."); }
    catch(e) { setError(e instanceof Error ? e.message : "No se pudieron reenviar las credenciales."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return (
    <>
      <main className="p-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
                Gestión de Usuarios
              </h1>

              <p className="mt-1 text-sm text-[#7A5055]">
                Administra los accesos y roles del personal en la plataforma
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddUser}
              disabled={busy || loading}
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0]"
            >
              + Agregar usuario
            </button>
          </header>

          <UsersFilters
            search={search}
            role={role}
            status={status}
            onSearchChange={setSearch}
            onRoleChange={setRole}
            onStatusChange={setStatus}
          />

          {notice && <p role="status" className="text-green-800">{notice}</p>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {loading && <p role="status">Cargando usuarios…</p>}
          <button type="button" disabled={busy || loading} onClick={() => void reload()} className="self-start text-sm underline">Actualizar usuarios</button>
          {!loading && <UsersTable
            users={filteredUsers}
            onView={handleView}
            onEdit={handleEditUser}
            onChangeStatus={handleChangeStatus}
          />}
        </section>
      </main>

      {showForm && (
        <UserFormModal
          mode={editingUser ? "edit" : "create"}
          initialValues={
            editingUser
              ? {
                  full_name:
                    editingUser.full_name,
                  email: editingUser.email,
                  role: editingUser.role,
                }
              : undefined
          }
          error={formError}
          saving={busy}
          onClose={() => {
            if (busyRef.current) return;
            setShowForm(false);
            setEditingUser(null);
            setFormError(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          busy={busy}
          message={error || notice}
          onResend={handleResend}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}