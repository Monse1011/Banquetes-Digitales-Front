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
  createPromotion,
  deactivatePromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
  type Promotion,
} from "@/lib/api/promotions";
import { formatDate, formatPercent, todayInMerida } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";

const DEFAULTS = { page: "1", per_page: "10" };
const DISCOUNT_ERROR = "El descuento es obligatorio y debe ser un número mayor a 0 y no mayor a 100 con máximo 2 decimales.";

function PromotionsCatalog() {
  const toast = useToast();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const { data, error, loading, reload } = useQuery(
    () => listPromotions({ page: Number(filters.page), per_page: Number(filters.per_page) }),
    JSON.stringify(filters),
  );
  const [form, setForm] = useState<{ mode: "create" } | { mode: "edit"; promotion: Promotion } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "inactive" | "delete"; promotion: Promotion } | null>(null);

  const columns: Column<Promotion>[] = [
    { key: "name", header: "Nombre", render: (promotion) => <span className="font-medium">{promotion.name}</span> },
    {
      key: "description",
      header: "Descripción",
      render: (promotion) => <span className="text-muted">{promotion.description}</span>,
      hideOnMobile: true,
    },
    { key: "discount", header: "Descuento", render: (promotion) => formatPercent(promotion.discount_percentage) },
    { key: "valid_until", header: "Vigente hasta", render: (promotion) => formatDate(promotion.valid_until) },
    {
      key: "status",
      header: "Estado",
      render: (promotion) => (
        <Badge tone={promotion.status === "ACTIVE" ? "ok" : "neutral"}>
          {promotion.status === "ACTIVE" ? "Vigente" : "No vigente"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
      render: (promotion) => (
        <div className="flex flex-wrap justify-end gap-1">
          {promotion.status === "ACTIVE" ? (
            <>
              <Button variant="ghost" size="sm" icon="edit" onClick={() => setForm({ mode: "edit", promotion })}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" icon="ban" onClick={() => setConfirm({ kind: "inactive", promotion })}>
                Marcar como no vigente
              </Button>
            </>
          ) : null}
          <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirm({ kind: "delete", promotion })}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Promociones"
        description="Descuentos aplicables al generar propuestas."
        actions={
          <Button icon="plus" onClick={() => setForm({ mode: "create" })}>
            Añadir promoción
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
              rowKey={(promotion) => promotion.id}
              empty={<EmptyState icon="percent" title="No hay promociones registradas." />}
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
        <PromotionFormModal
          promotion={form.mode === "edit" ? form.promotion : undefined}
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
          await deactivatePromotion(confirm.promotion.id);
          toast.success("Promoción marcada como no vigente");
          reload();
        }}
      >
        <p className="font-medium">{confirm?.promotion.name}</p>
        <p>¿Está seguro de que desea marcar esta promoción como no vigente?</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "delete"}
        onClose={() => setConfirm(null)}
        title="Eliminar promoción"
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={async () => {
          if (!confirm) return;
          await deletePromotion(confirm.promotion.id);
          toast.success("Promoción eliminada.");
          reload();
        }}
      >
        <p>
          Se eliminará <strong>{confirm?.promotion.name}</strong> del catálogo. Las propuestas y reservaciones que ya la
          incluyen conservan el nombre, la descripción y el porcentaje con los que se aplicaron.
        </p>
      </ConfirmDialog>
    </>
  );
}

function PromotionFormModal({
  promotion,
  onClose,
  onSaved,
}: {
  promotion?: Promotion;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [initial] = useState(() => ({
    name: promotion?.name ?? "",
    description: promotion?.description ?? "",
    discount: promotion ? String(promotion.discount_percentage) : "",
    valid_until: promotion?.valid_until ?? "",
  }));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const dirty =
    values.name !== initial.name ||
    values.description !== initial.description ||
    values.discount !== initial.discount ||
    values.valid_until !== initial.valid_until;

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
    const discount = values.discount.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(discount) || Number(discount) <= 0 || Number(discount) > 100) {
      found.discount = DISCOUNT_ERROR;
    }
    if (!values.valid_until) found.valid_until = "La fecha de vigencia es obligatoria.";
    else if (values.valid_until < todayInMerida()) found.valid_until = "La fecha de vigencia no puede ser anterior a la fecha actual.";
    return found;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setError("");
    if (Object.keys(found).length) return;
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      discount_percentage: Number(values.discount),
      valid_until: values.valid_until,
    };
    setBusy(true);
    try {
      if (promotion) {
        await updatePromotion(promotion.id, payload);
        toast.success("Cambios guardados exitosamente");
      } else {
        await createPromotion(payload);
        toast.success("Promoción guardada exitosamente");
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
      title={promotion ? "Editar promoción" : "Añadir promoción"}
      description="La promoción es vigente desde su registro hasta la fecha de vigencia indicada, inclusive."
      footer={
        <>
          <Button variant="secondary" onClick={requestClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="promotion-form" loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="promotion-form" className="space-y-4" onSubmit={submit} noValidate>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Descuento (%)"
            type="number"
            min={0.01}
            max={100}
            step="0.01"
            value={values.discount}
            onChange={(e) => setValues((v) => ({ ...v, discount: e.target.value }))}
            error={errors.discount}
            required
          />
          <TextField
            label="Fecha de vigencia"
            type="date"
            min={todayInMerida()}
            value={values.valid_until}
            onChange={(e) => setValues((v) => ({ ...v, valid_until: e.target.value }))}
            error={errors.valid_until}
            required
          />
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={promotion ? "¿Desea cancelar los cambios?" : "¿Desea cancelar el registro?"}
        confirmLabel="Descartar cambios"
        cancelLabel="Continuar editando"
        onConfirm={onClose}
      />
    </Modal>
  );
}

export default function PromotionsPage() {
  return (
    <RequirePermission permission="promotions.manage">
      <PromotionsCatalog />
    </RequirePermission>
  );
}
