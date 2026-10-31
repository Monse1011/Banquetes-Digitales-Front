"use client";

import { useState } from "react";
import { ErrorState } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { Card, DataTable, PageHeader } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage } from "@/lib/api/http";
import { createOperativeRole, deleteOperativeRole, listOperativeRoles, updateOperativeRole, type OperativeRole } from "@/lib/api/resources";
import { useQuery } from "@/lib/hooks";

function OperativeRolesPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useQuery(listOperativeRoles, "operative-roles");
  const [editing, setEditing] = useState<OperativeRole | "new" | null>(null);
  const [removing, setRemoving] = useState<OperativeRole | null>(null);

  return (
    <>
      <PageHeader
        title="Roles operativos"
        description="Puestos que puede desempeñar el personal (por ejemplo: chef, mesero, bartender)."
        actions={
          <Button icon="plus" onClick={() => setEditing("new")}>
            Nuevo rol
          </Button>
        }
      />
      <Card className="max-w-3xl">
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <DataTable
            rows={data ?? []}
            rowKey={(role) => role.id}
            columns={[
              { key: "name", header: "Nombre", render: (role) => <span className="font-medium">{role.name}</span> },
              {
                key: "actions",
                header: "",
                className: "text-right",
                render: (role) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(role)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" icon="trash" className="text-danger" onClick={() => setRemoving(role)}>
                      Dar de baja
                    </Button>
                  </div>
                ),
              },
            ]}
            empty={<EmptyState icon="tag" title="Sin roles operativos">Crea el primer rol para poder registrar personal.</EmptyState>}
          />
        )}
      </Card>

      {editing ? (
        <RoleForm
          role={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Dar de baja rol operativo"
        confirmLabel="Dar de baja"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await deleteOperativeRole(removing.id);
          toast.success(`Rol «${removing.name}» dado de baja.`);
          reload();
        }}
      >
        <p>«{removing?.name}» ya no podrá asignarse a nuevo personal. El personal existente conserva su rol.</p>
      </ConfirmDialog>
    </>
  );
}

function RoleForm({ role, onClose, onSaved }: { role?: OperativeRole; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(role?.name ?? "");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setFieldError("El nombre es obligatorio.");
      return;
    }
    if (name.trim().length > 100) {
      setFieldError("Máximo 100 caracteres.");
      return;
    }
    setFieldError("");
    setBusy(true);
    try {
      if (role) await updateOperativeRole(role.id, name.trim());
      else await createOperativeRole(name.trim());
      toast.success(role ? "Rol actualizado." : "Rol creado.");
      onSaved();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.fieldErrors.name) setFieldError(err.fieldErrors.name);
      else setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={role ? "Editar rol operativo" : "Nuevo rol operativo"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="role-form" loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={save} noValidate className="space-y-4">
        <TextField label="Nombre" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} error={fieldError} required />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

export default function OperativeRolesRoute() {
  return (
    <RequirePermission permission="resources.manage">
      <OperativeRolesPage />
    </RequirePermission>
  );
}
