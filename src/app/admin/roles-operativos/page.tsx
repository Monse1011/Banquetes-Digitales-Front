 "use client";

import { useState } from "react";

import { OperativeRoleFormModal } from "@/components/admin/operative-roles/operative-role-form-modal";
import { MOCK_OPERATIVE_ROLES } from "@/components/admin/operative-roles/operative-role-mocks";
import { OperativeRolesTable } from "@/components/admin/operative-roles/operative-roles-table";

import type {
  OperativeRole,
  OperativeRoleFormValues,
} from "@/components/admin/operative-roles/operative-role-types";

export default function OperativeRolesPage() {
  const [roles, setRoles] =
    useState<OperativeRole[]>(MOCK_OPERATIVE_ROLES);

  const [showModal, setShowModal] = useState(false);

  const [editingRole, setEditingRole] =
    useState<OperativeRole | null>(null);

  function handleAddRole() {
    setEditingRole(null);
    setShowModal(true);
  }

  function handleEditRole(role: OperativeRole) {
    setEditingRole(role);
    setShowModal(true);
  }

  function handleSubmit(
    values: OperativeRoleFormValues,
  ) {
    if (editingRole) {
      setRoles((currentRoles) =>
        currentRoles.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: values.name,
              }
            : role,
        ),
      );
    } else {
      const nextId =
        Math.max(
          ...roles.map((role) => role.id),
          0,
        ) + 1;

      const newRole: OperativeRole = {
        id: nextId,
        name: values.name,
        is_active: true,
        active_human_resources_count: 0,
      };

      setRoles((currentRoles) => [
        ...currentRoles,
        newRole,
      ]);
    }

    setShowModal(false);
    setEditingRole(null);
  }

  function handleChangeStatus(
    selectedRole: OperativeRole,
  ) {
    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              is_active: !role.is_active,
            }
          : role,
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
                Roles Operativos
              </h1>

              <p className="mt-1 text-sm text-[#7A5055]">
                Define los perfiles de personal requeridos para los banquetes
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRole}
              className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)]"
            >
              + Agregar rol
            </button>
          </header>

          <OperativeRolesTable
            roles={roles}
            onEdit={handleEditRole}
            onChangeStatus={handleChangeStatus}
          />
        </section>
      </main>

      {showModal && (
        <OperativeRoleFormModal
          mode={editingRole ? "edit" : "create"}
          initialValues={
            editingRole
              ? {
                  name: editingRole.name,
                }
              : undefined
          }
          onClose={() => {
            setShowModal(false);
            setEditingRole(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}