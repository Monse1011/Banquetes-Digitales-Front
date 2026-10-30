"use client";

import { useState } from "react";
import { ErrorState, FilterBar, FilterSelect, SearchInput } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { Button } from "@/components/ui/button";
import { Alert, Badge, EmptyState, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { SelectField, TextField } from "@/components/ui/form";
import { Card, DataTable, DetailList, PageHeader, Pagination, type Column } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { UserRole } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/http";
import {
  createUser,
  getUser,
  listUsers,
  resendCredentials,
  setUserStatus,
  updateUser,
  type SystemUser,
  type UserInput,
} from "@/lib/api/users";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";
import { EMAIL_REGEX } from "@/lib/validation";

const DEFAULTS = { search: "", role: "", status: "", page: "1", per_page: "10" };

const COLUMNS: Column<SystemUser>[] = [
  { key: "employee", header: "Empleado", render: (u) => <span className="font-mono text-xs">{u.employee_id}</span> },
  {
    key: "name",
    header: "Nombre",
    render: (u) => (
      <div>
        <p className="font-medium">{u.full_name}</p>
        <p className="text-xs text-muted">{u.email}</p>
      </div>
    ),
  },
  { key: "role", header: "Rol", render: (u) => ROLE_LABELS[u.role] ?? u.role },
  {
    key: "status",
    header: "Estado",
    render: (u) => <Badge tone={u.status === "ACTIVE" ? "ok" : "neutral"}>{u.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>,
  },
];

function UsersList() {
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const { data, error, loading, reload } = useQuery(
    () => listUsers({ ...filters, page: Number(filters.page), per_page: Number(filters.per_page) }),
    JSON.stringify(filters),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState<{ mode: "create" } | { mode: "edit"; user: SystemUser } | null>(null);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas del personal con acceso al panel."
        actions={
          <Button icon="plus" onClick={() => setForm({ mode: "create" })}>
            Nuevo usuario
          </Button>
        }
      />
      <Card>
        <FilterBar>
          <SearchInput value={filters.search} onChange={(search) => setFilters({ search })} placeholder="Nombre, correo o número de empleado" />
          <FilterSelect label="Rol" value={filters.role} onChange={(role) => setFilters({ role })}>
            <option value="">Todos</option>
            <option value="ADMIN">Administrador</option>
            <option value="LOGISTICS">Logística</option>
          </FilterSelect>
          <FilterSelect label="Estado" value={filters.status} onChange={(status) => setFilters({ status })}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </FilterSelect>
        </FilterBar>
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <DataTable
              columns={COLUMNS}
              rows={data?.items ?? []}
              rowKey={(u) => u.id}
              onRowClick={(u) => setSelected(u.id)}
              empty={<EmptyState icon="users" title="Sin usuarios">No hay usuarios con esos filtros.</EmptyState>}
            />
            {data ? (
              <Pagination
                pagination={data.pagination}
                onPageChange={(page) => setFilters({ page: String(page) }, false)}
                onPerPageChange={(perPage) => setFilters({ per_page: String(perPage) })}
              />
            ) : null}
          </div>
        )}
      </Card>

      {selected !== null ? (
        <UserDetailModal
          userId={selected}
          onClose={() => setSelected(null)}
          onEdit={(user) => {
            setSelected(null);
            setForm({ mode: "edit", user });
          }}
          onChanged={reload}
        />
      ) : null}
      {form ? (
        <UserFormModal
          user={form.mode === "edit" ? form.user : undefined}
          onClose={() => setForm(null)}
          onSaved={(user) => {
            setForm(null);
            reload();
            if (user) setSelected(user.id);
          }}
        />
      ) : null}
    </>
  );
}

function UserDetailModal({
  userId,
  onClose,
  onEdit,
  onChanged,
}: {
  userId: number;
  onClose: () => void;
  onEdit: (user: SystemUser) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const { user: me } = useAuth();
  const { data, error, loading, reload } = useQuery(() => getUser(userId), String(userId));
  const [confirm, setConfirm] = useState<"status" | "credentials" | null>(null);
  const isMe = me?.id === userId;
  const active = data?.status === "ACTIVE";

  return (
    <Modal
      open
      onClose={onClose}
      title={data?.full_name ?? "Usuario"}
      description={data ? `${ROLE_LABELS[data.role]} · Empleado ${data.employee_id}` : undefined}
      size="lg"
      footer={
        data ? (
          <>
            <Button variant="ghost" icon="mail" onClick={() => setConfirm("credentials")} disabled={!active}>
              Reenviar credenciales
            </Button>
            <Button variant={active ? "danger" : "secondary"} onClick={() => setConfirm("status")} disabled={isMe && active}>
              {active ? "Desactivar" : "Activar"}
            </Button>
            <Button icon="edit" onClick={() => onEdit(data)}>
              Editar
            </Button>
          </>
        ) : null
      }
    >
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <Alert tone="danger">{error.message}</Alert>
      ) : data ? (
        <div className="space-y-6">
          <DetailList
            items={[
              { label: "Correo", value: data.email },
              { label: "Estado", value: <Badge tone={active ? "ok" : "neutral"}>{active ? "Activo" : "Inactivo"}</Badge> },
              { label: "Último acceso", value: data.last_access ? formatDateTime(data.last_access) : "Nunca (primer acceso pendiente)" },
              { label: "Alta", value: formatDateTime(data.created_at) },
            ]}
          />
          {isMe && active ? <p className="text-xs text-muted">No puedes desactivar tu propia cuenta.</p> : null}
          {data.assigned_requests?.length ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Solicitudes a su cargo</p>
              <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                {data.assigned_requests.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="font-mono text-xs text-wine">{request.folio}</span>
                    <span className="flex-1 text-muted">{formatDate(request.event_date)}</span>
                    <StatusBadge status={request.status} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {data ? (
        <>
          <ConfirmDialog
            open={confirm === "status"}
            onClose={() => setConfirm(null)}
            title={active ? "Desactivar usuario" : "Activar usuario"}
            confirmLabel={active ? "Desactivar" : "Activar"}
            tone={active ? "danger" : "primary"}
            onConfirm={async () => {
              await setUserStatus(data.id, active ? "INACTIVE" : "ACTIVE");
              toast.success(active ? "Usuario desactivado." : "Usuario activado.");
              reload();
              onChanged();
            }}
          >
            {active ? (
              <p>
                <strong>{data.full_name}</strong> ya no podrá iniciar sesión. No se permite desactivar al único administrador
                activo ni a usuarios con solicitudes activas.
              </p>
            ) : (
              <p>
                <strong>{data.full_name}</strong> podrá volver a iniciar sesión.
              </p>
            )}
          </ConfirmDialog>
          <ConfirmDialog
            open={confirm === "credentials"}
            onClose={() => setConfirm(null)}
            title="Reenviar credenciales"
            confirmLabel="Reenviar"
            onConfirm={async () => {
              await resendCredentials(data.id);
              toast.success(`Se enviaron nuevas credenciales a ${data.email}.`);
            }}
          >
            <p>
              Se generará una contraseña temporal nueva y se enviará a <strong>{data.email}</strong>. Solo es posible si el
              usuario aún no ha definido su contraseña.
            </p>
          </ConfirmDialog>
        </>
      ) : null}
    </Modal>
  );
}

function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user?: SystemUser;
  onClose: () => void;
  onSaved: (user?: SystemUser) => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<UserInput>({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "LOGISTICS",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const found: Record<string, string> = {};
    if (!values.full_name.trim()) found.full_name = "El nombre completo es obligatorio.";
    else if (values.full_name.trim().length > 100) found.full_name = "Máximo 100 caracteres.";
    if (!EMAIL_REGEX.test(values.email.trim())) found.email = "Ingresa un correo válido.";
    return found;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    const payload = { full_name: values.full_name.trim(), email: values.email.trim(), role: values.role };
    setBusy(true);
    try {
      if (user) {
        await updateUser(user.id, payload);
        toast.success("Usuario actualizado.");
        onSaved();
      } else {
        const created = await createUser(payload);
        toast.success(`Usuario creado. Se envió el número de empleado ${created.employee_id} y su contraseña temporal por correo.`);
        onSaved(created);
      }
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 502 && !user) {
        // El usuario sí se creó; solo falló el correo de bienvenida.
        toast.error("El usuario se creó, pero no se pudo enviar el correo. Reenvía las credenciales desde su detalle.");
        onSaved();
        return;
      }
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={user ? "Editar usuario" : "Nuevo usuario"}
      description={user ? `Empleado ${user.employee_id}` : "Se generarán el número de empleado y una contraseña temporal que se enviarán por correo."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={busy}>
            {user ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </>
      }
    >
      <form id="user-form" className="space-y-4" onSubmit={submit} noValidate>
        <TextField
          label="Nombre completo"
          value={values.full_name}
          maxLength={100}
          onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))}
          error={errors.full_name}
          required
        />
        <TextField
          label="Correo electrónico"
          type="email"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          error={errors.email}
          required
        />
        <SelectField
          label="Rol"
          value={values.role}
          onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as UserRole }))}
          error={errors.role}
          hint={user ? "No es posible cambiar el rol de un usuario con solicitudes activas." : undefined}
          required
        >
          <option value="LOGISTICS">Logística</option>
          <option value="ADMIN">Administrador</option>
        </SelectField>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}

export default function UsersPage() {
  return (
    <RequirePermission permission="users.manage">
      <UsersList />
    </RequirePermission>
  );
}
