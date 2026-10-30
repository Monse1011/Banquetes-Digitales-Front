"use client";

import { useMemo, useState } from "react";
import { ErrorState, FilterBar, FilterSelect, SearchInput } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { Button } from "@/components/ui/button";
import { Alert, Badge, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { SelectField, TextField } from "@/components/ui/form";
import { Card, DataTable, PageHeader, Pagination, Tabs, type Column } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage } from "@/lib/api/http";
import {
  createHumanResource,
  createInventoryResource,
  deleteLogisticResource,
  listOperativeRoles,
  listResources,
  listResourcesByType,
  RESOURCE_TYPE_LABELS,
  setResourceActive,
  updateHumanResource,
  updateInventoryResource,
  type InventoryType,
  type OperativeRole,
  type Resource,
  type ResourceType,
} from "@/lib/api/resources";
import { formatMoney } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";

type Tab = "catalog" | "HUMAN" | "MATERIAL" | "LOGISTIC";

const DEFAULTS = { tab: "catalog", name: "", status: "active", type: "", operative_role_id: "", order: "asc", page: "1", per_page: "10" };

function ResourcesPage() {
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const tab = filters.tab as Tab;
  const roles = useQuery(listOperativeRoles, "operative-roles");
  const roleNames = useMemo(() => new Map((roles.data ?? []).map((role) => [role.id, role.name])), [roles.data]);

  const { data, error, loading, reload } = useQuery(() => {
    const common = {
      name: filters.name,
      status: filters.status as "active" | "inactive",
      order: filters.order as "asc" | "desc",
      page: Number(filters.page),
      per_page: Number(filters.per_page),
    };
    if (tab === "catalog") return listResources({ ...common, type: filters.type });
    return listResourcesByType(tab, { ...common, operative_role_id: tab === "HUMAN" ? filters.operative_role_id : undefined });
  }, JSON.stringify(filters));

  const toast = useToast();
  const [editing, setEditing] = useState<{ type: ResourceType; resource?: Resource } | null>(null);
  const [toggling, setToggling] = useState<Resource | null>(null);
  const [removing, setRemoving] = useState<Resource | null>(null);

  const columns: Column<Resource>[] = [
    { key: "name", header: "Nombre", render: (r) => <span className="font-medium">{r.name}</span> },
    ...(tab === "catalog"
      ? [{ key: "type", header: "Tipo", render: (r: Resource) => RESOURCE_TYPE_LABELS[r.type] ?? r.type }]
      : []),
    ...(tab === "HUMAN" || tab === "catalog"
      ? [
          {
            key: "role",
            header: "Rol operativo",
            render: (r: Resource) => (r.operative_role_id ? (roleNames.get(r.operative_role_id) ?? `#${r.operative_role_id}`) : "—"),
          },
        ]
      : []),
    ...(tab !== "HUMAN"
      ? [
          { key: "quantity", header: "Cantidad", className: "text-right", render: (r: Resource) => r.quantity ?? "—" },
          {
            key: "cost",
            header: "Costo unitario",
            className: "text-right",
            render: (r: Resource) => (r.unit_cost !== undefined && r.unit_cost !== null ? formatMoney(r.unit_cost) : "—"),
          },
        ]
      : []),
    {
      key: "status",
      header: "Estado",
      render: (r) => <Badge tone={r.is_active ? "ok" : "neutral"}>{r.is_active ? "Activo" : "Inactivo"}</Badge>,
    },
    ...(tab !== "catalog"
      ? [
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (r: Resource) => (
              <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing({ type: r.type, resource: r })}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setToggling(r)}>
                  {r.is_active ? "Desactivar" : "Activar"}
                </Button>
                {r.type === "LOGISTIC" && r.is_active ? (
                  <Button size="sm" variant="ghost" icon="trash" className="text-danger" onClick={() => setRemoving(r)} aria-label={`Dar de baja ${r.name}`} />
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Recursos"
        description="Personal, material y equipo logístico disponibles para los eventos."
        actions={
          tab !== "catalog" ? (
            <Button icon="plus" onClick={() => setEditing({ type: tab })}>
              Nuevo {RESOURCE_TYPE_LABELS[tab].toLowerCase()}
            </Button>
          ) : null
        }
      />
      <Card>
        <div className="px-5 pt-3">
          <Tabs<Tab>
            value={tab}
            onChange={(value) => setFilters({ tab: value, type: "", operative_role_id: "" })}
            tabs={[
              { value: "catalog", label: "Catálogo" },
              { value: "HUMAN", label: "Humanos" },
              { value: "MATERIAL", label: "Materiales" },
              { value: "LOGISTIC", label: "Logísticos" },
            ]}
          />
        </div>
        <FilterBar>
          <SearchInput key={tab} value={filters.name} onChange={(name) => setFilters({ name })} placeholder="Buscar por nombre" />
          {tab === "catalog" ? (
            <FilterSelect label="Tipo" value={filters.type} onChange={(type) => setFilters({ type })}>
              <option value="">Todos</option>
              <option value="HUMAN">Humano</option>
              <option value="MATERIAL">Material</option>
              <option value="LOGISTIC">Logístico</option>
            </FilterSelect>
          ) : null}
          {tab === "HUMAN" ? (
            <FilterSelect label="Rol operativo" value={filters.operative_role_id} onChange={(id) => setFilters({ operative_role_id: id })}>
              <option value="">Todos</option>
              {(roles.data ?? []).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </FilterSelect>
          ) : null}
          <FilterSelect label="Estado" value={filters.status} onChange={(status) => setFilters({ status })}>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </FilterSelect>
          <FilterSelect label="Orden" value={filters.order} onChange={(order) => setFilters({ order })}>
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </FilterSelect>
        </FilterBar>
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(r) => r.id}
              empty={<EmptyState icon="box" title="Sin recursos">No hay recursos con esos filtros.</EmptyState>}
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

      {editing ? (
        editing.type === "HUMAN" ? (
          <HumanForm
            resource={editing.resource}
            roles={roles.data ?? []}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        ) : (
          <InventoryForm
            type={editing.type}
            resource={editing.resource}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )
      ) : null}

      <ConfirmDialog
        open={toggling !== null}
        onClose={() => setToggling(null)}
        title={toggling?.is_active ? "Desactivar recurso" : "Activar recurso"}
        confirmLabel={toggling?.is_active ? "Desactivar" : "Activar"}
        tone={toggling?.is_active ? "danger" : "primary"}
        onConfirm={async () => {
          if (!toggling) return;
          await setResourceActive(toggling.type, toggling.id, !toggling.is_active);
          toast.success(toggling.is_active ? "Recurso desactivado." : "Recurso activado.");
          reload();
        }}
      >
        <p>
          {toggling?.is_active
            ? `«${toggling?.name}» dejará de estar disponible para nuevas asignaciones.`
            : `«${toggling?.name}» volverá a estar disponible para asignarse.`}
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Dar de baja recurso logístico"
        confirmLabel="Dar de baja"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await deleteLogisticResource(removing.id);
          toast.success("Recurso dado de baja.");
          reload();
        }}
      >
        <p>«{removing?.name}» se dará de baja (baja lógica); su historial se conserva.</p>
      </ConfirmDialog>
    </>
  );
}

function HumanForm({
  resource,
  roles,
  onClose,
  onSaved,
}: {
  resource?: Resource;
  roles: OperativeRole[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(resource?.name ?? "");
  const [roleId, setRoleId] = useState(resource?.operative_role_id ? String(resource.operative_role_id) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (confirmDuplicate = false) => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = "El nombre es obligatorio.";
    if (!roleId) found.operative_role_id = "Selecciona un rol operativo.";
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    const input = { name: name.trim(), operative_role_id: Number(roleId) };
    setBusy(true);
    try {
      if (resource) await updateHumanResource(resource.id, input);
      else await createHumanResource(input, confirmDuplicate);
      toast.success(resource ? "Recurso actualizado." : "Persona registrada.");
      onSaved();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 409 && err.payload.requires_confirmation) {
        setDuplicate(err.message);
        return;
      }
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={resource ? "Editar recurso humano" : "Registrar persona"}
      footer={
        duplicate ? (
          <>
            <Button variant="secondary" onClick={() => setDuplicate("")} disabled={busy}>
              Revisar datos
            </Button>
            <Button onClick={() => save(true)} loading={busy}>
              Registrar de todos modos
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={() => save()} loading={busy}>
              Guardar
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <TextField label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
        <SelectField label="Rol operativo" value={roleId} onChange={(e) => setRoleId(e.target.value)} error={errors.operative_role_id} required>
          <option value="">Selecciona…</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
        {duplicate ? (
          <Alert tone="warn" title="Posible duplicado">
            {duplicate}
          </Alert>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

function InventoryForm({
  type,
  resource,
  onClose,
  onSaved,
}: {
  type: InventoryType;
  resource?: Resource;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState({
    name: resource?.name ?? "",
    quantity: resource?.quantity !== undefined ? String(resource.quantity) : "",
    unit_cost: resource?.unit_cost !== undefined && resource.unit_cost !== null ? String(resource.unit_cost) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const label = RESOURCE_TYPE_LABELS[type].toLowerCase();

  const save = async () => {
    const quantity = Number(values.quantity);
    const unitCost = Number(values.unit_cost);
    const found: Record<string, string> = {};
    if (!values.name.trim()) found.name = "El nombre es obligatorio.";
    if (values.quantity === "" || !Number.isInteger(quantity) || quantity < 0) found.quantity = "Entero mayor o igual a cero.";
    if (values.unit_cost === "" || Number.isNaN(unitCost) || unitCost < 0 || !/^\d+(\.\d{1,2})?$/.test(values.unit_cost)) {
      found.unit_cost = "Número mayor o igual a cero, máximo dos decimales.";
    }
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    const input = { name: values.name.trim(), quantity, unit_cost: unitCost };
    setBusy(true);
    try {
      if (resource) await updateInventoryResource(type, resource.id, input);
      else await createInventoryResource(type, input);
      toast.success(resource ? "Recurso actualizado." : "Recurso registrado.");
      onSaved();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={resource ? `Editar recurso ${label}` : `Nuevo recurso ${label}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={save} loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="Nombre" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} error={errors.name} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Cantidad disponible"
            type="number"
            min={0}
            step={1}
            value={values.quantity}
            onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))}
            error={errors.quantity}
            required
          />
          <TextField
            label="Costo unitario (MXN)"
            type="number"
            min={0}
            step="0.01"
            value={values.unit_cost}
            onChange={(e) => setValues((v) => ({ ...v, unit_cost: e.target.value }))}
            error={errors.unit_cost}
            required
          />
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}

export default function ResourcesRoute() {
  return (
    <RequirePermission permission="resources.manage">
      <ResourcesPage />
    </RequirePermission>
  );
}
