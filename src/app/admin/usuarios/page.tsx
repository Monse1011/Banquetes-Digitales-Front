"use client";

import { useMemo, useState } from "react";

import { UserDetailModal } from "@/components/admin/users/user-detail-modal";
import { UserFormModal } from "@/components/admin/users/user-form-modal";
import { MOCK_USERS } from "@/components/admin/users/user-mock";
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
    useState<AdminUser[]>(MOCK_USERS);

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

    return users.filter((user) => {
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
  }, [users, search, role, status]);

  function handleAddUser() {
    setEditingUser(null);
    setFormError(null);
    setShowForm(true);
  }

  function handleEditUser(user: AdminUser) {
    setEditingUser(user);
    setFormError(null);
    setShowForm(true);
  }

  function handleSubmit(values: UserFormValues) {
    const normalizedEmail =
      values.email.trim().toLowerCase();

    const duplicatedEmail = users.some(
      (user) =>
        user.id !== editingUser?.id &&
        user.email.trim().toLowerCase() ===
          normalizedEmail,
    );

    if (duplicatedEmail) {
      setFormError(
        "Ya existe un usuario registrado con el correo electrónico indicado.",
      );
      return;
    }

    const selectedRole = values.role;

    if (!selectedRole) {
    return;
    }


    if (editingUser) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                full_name: values.full_name,
                email: values.email,
                role: selectedRole,
                updated_at:
                  new Date().toISOString(),
              }
            : user,
        ),
      );
    } else {
      const nextId =
        Math.max(
          ...users.map((user) => user.id),
          0,
        ) + 1;

      const newUser: AdminUser = {
        id: nextId,
        employee_id: String(1000 + nextId),
        full_name: values.full_name,
        email: values.email,
        role: selectedRole,
        status: "ACTIVE",
        last_access: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUsers((currentUsers) => [
        ...currentUsers,
        newUser,
      ]);
    }

    setShowForm(false);
    setEditingUser(null);
    setFormError(null);
  }

  function handleChangeStatus(user: AdminUser) {
    if (user.is_current_user) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id
          ? {
              ...currentUser,
              status:
                currentUser.status === "ACTIVE"
                  ? "INACTIVE"
                  : "ACTIVE",
              updated_at:
                new Date().toISOString(),
            }
          : currentUser,
      ),
    );
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

          <UsersTable
            users={filteredUsers}
            onView={setSelectedUser}
            onEdit={handleEditUser}
            onChangeStatus={handleChangeStatus}
          />
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
          onClose={() => {
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
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}