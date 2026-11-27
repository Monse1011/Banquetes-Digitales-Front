"use client";

import { useState } from "react";
import { ErrorState } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { Button } from "@/components/ui/button";
import { Alert, Badge, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/form";
import { Card, DataTable, PageHeader, Pagination, type Column } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ApiError, errorMessage } from "@/lib/api/http";
import {
  createService,
  deleteService,
  listServices,
  setServiceStatus,
  updateService,
  type AdminService,
} from "@/lib/api/services";
import { formatMoney } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";
import { isValidPrice } from "@/lib/validation";

const DEFAULTS = { page: "1", per_page: "10" };
const PRICE_ERROR = "El precio es obligatorio y debe ser un número mayor a 0 con máximo 2 decimales.";

function ServicesCatalog() {
  const toast = useToast();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const { data, error, loading, reload } = useQuery(
    () => listServices({ page: Number(filters.page), per_page: Number(filters.per_page) }),
    JSON.stringify(filters),
  );
  const [form, setForm] = useState<{ mode: "create" } | { mode: "edit"; service: AdminService } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "inactive" | "delete"; service: AdminService } | null>(null);

  const reactivate = async (service: AdminService) => {
    try {
      await setServiceStatus(service.id, "ACTIVE");
      toast.success("Servicio reactivado exitosamente");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<AdminService>[] = [
    { key: "name", header: "Nombre", render: (service) => <span className="font-medium">{service.name}</span> },
    {
      key: "description",
      header: "Descripción",
      render: (service) => <span className="text-muted">{service.description}</span>,
      hideOnMobile: true,
    },
    { key: "price", header: "Precio", render: (service) => formatMoney(service.price) },
    {
      key: "status",
      header: "Estado",
      render: (service) => (
        <Badge tone={service.status === "ACTIVE" ? "ok" : "neutral"}>
          {service.status === "ACTIVE" ? "Vigente" : "No vigente"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (service) => (
        <div className="flex flex-wrap justify-end gap-1">
          {service.status === "ACTIVE" ? (
            <>
              <Button variant="ghost" size="sm" icon="edit" onClick={() => setForm({ mode: "edit", service })}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" icon="ban" onClick={() => setConfirm({ kind: "inactive", service })}>
                Marcar como no vigente
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => reactivate(service)}>
              Reactivar
            </Button>
          )}
          <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirm({ kind: "delete", service })}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Catálogo de servicios con precio y vigencia."
        actions={
          <Button icon="plus" onClick={() => setForm({ mode: "create" })}>
            Añadir servicio
          </Button>
        }
      />
      <Card>
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(service) => service.id}
              empty={<EmptyState icon="cloche" title="No hay servicios registrados." />}
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

      {form ? (
        <ServiceFormModal
          service={form.mode === "edit" ? form.service : undefined}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirm?.kind === "inactive"}
        onClose={() => setConfirm(null)}
        title="Marcar como no vigente"
        confirmLabel="Confirmar"
        onConfirm={async () => {
          if (!confirm) return;
          await setServiceStatus(confirm.service.id, "INACTIVE");
          toast.success("Servicio marcado como no vigente");
          reload();
        }}
      >
        <p className="font-medium">{confirm?.service.name}</p>
        <p>¿Está seguro de que desea marcar este servicio como no vigente?</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "delete"}
        onClose={() => setConfirm(null)}
        title="Eliminar servicio"
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={async () => {
          if (!confirm) return;
          await deleteService(confirm.service.id);
          toast.success("Servicio eliminado.");
          reload();
        }}
      >
        <p>
          Se eliminará <strong>{confirm?.service.name}</strong> del catálogo. Las solicitudes, propuestas y reservaciones
          que ya lo incluyen conservan el nombre, la descripción y el precio con los que se contrataron.
        </p>
      </ConfirmDialog>
    </>
  );
}

function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service?: AdminService;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [initial] = useState(() => ({
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service ? String(service.price) : "",
  }));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const dirty = values.name !== initial.name || values.description !== initial.description || values.price !== initial.price;

  const requestClose = () => {
    if (busy) return;
    if (dirty) setCancelOpen(true);
    else onClose();
  };

  const validate = () => {
    const found: Record<string, string> = {};
    const name = values.name.trim();
    if (!name) found.name = "El nombre es obligatorio.";
    else if (name.length > 100) found.name = "El nombre no debe exceder 100 caracteres.";
    const description = values.description.trim();
    if (!description) found.description = "La descripción breve es obligatoria.";
    else if (description.length > 300) found.description = "La descripción breve no debe exceder 300 caracteres.";
    if (!isValidPrice(values.price)) found.price = PRICE_ERROR;
    return found;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    const payload = { name: values.name.trim(), description: values.description.trim(), price: Number(values.price) };
    setBusy(true);
    try {
      if (service) {
        await updateService(service.id, payload);
        toast.success("Cambios guardados exitosamente");
      } else {
        await createService(payload);
        toast.success("Servicio guardado exitosamente");
      }
      onSaved();
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 409) setErrors({ name: err.message });
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={requestClose}
      title={service ? "Editar servicio" : "Añadir servicio"}
      footer={
        <>
          <Button variant="secondary" onClick={requestClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="service-form" loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="service-form" className="space-y-4" onSubmit={submit} noValidate>
        <TextField
          label="Nombre"
          value={values.name}
          maxLength={100}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          error={errors.name}
          required
        />
        <TextAreaField
          label="Descripción breve"
          rows={3}
          maxLength={300}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          error={errors.description}
          required
        />
        <TextField
          label="Precio"
          type="number"
          min={0.01}
          step="0.01"
          value={values.price}
          onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
          error={errors.price}
          hint="MXN, mayor a 0 con máximo 2 decimales."
          required
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={service ? "¿Desea cancelar los cambios?" : "¿Desea cancelar el registro?"}
        confirmLabel="Descartar cambios"
        cancelLabel="Continuar editando"
        onConfirm={onClose}
      />
    </Modal>
  );
}

export default function ServicesPage() {
  return (
    <RequirePermission permission="services.manage">
      <ServicesCatalog />
    </RequirePermission>
  );
}
