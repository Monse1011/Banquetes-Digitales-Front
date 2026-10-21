"use client";
import { useState } from "react";
import {
  validInventory,
  type InventoryKind,
  type InventoryValues,
} from "@/lib/api/inventory-resources";
const field =
  "w-full rounded border border-[#D4BFC2] bg-white p-3 text-[#2C1A1D]";
export function InventoryResourceForm({
  kind,
  initialValues,
  saving,
  error,
  onClose,
  onSave,
}: {
  kind: InventoryKind;
  initialValues?: InventoryValues;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (values: InventoryValues) => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [quantity, setQuantity] = useState(
    initialValues ? String(initialValues.quantity) : "",
  );
  const [cost, setCost] = useState(
    initialValues ? String(initialValues.unit_cost) : "",
  );
  const values = {
    name: name.trim(),
    quantity: Number(quantity),
    unit_cost: Number(cost),
  };
  const valid =
    quantity.trim() !== "" && cost.trim() !== "" && validInventory(values);
  const label = kind === "material" ? "Material" : "Logístico";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-[#FDFAF8] p-6"
      >
        <h2
          id="inventory-form-title"
          className="font-display text-2xl text-[#2C1A1D]"
        >
          {initialValues ? "Editar" : "Agregar"} recurso {label.toLowerCase()}
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (valid && !saving) onSave(values);
          }}
        >
          <fieldset disabled={saving} className="mt-5 space-y-4">
            <label className="block">
              Tipo
              <input className={field} value={label} readOnly />
            </label>
            <label className="block">
              Nombre completo del recurso
              <input
                className={field}
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              Cantidad en stock
              <input
                className={field}
                type="number"
                required
                min="0"
                max="2147483647"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className="block">
              Costo unitario
              <input
                className={field}
                type="number"
                required
                min="0"
                max="9999999999.99"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <footer className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded border px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!valid || saving}
                className="rounded bg-[#6B2737] px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
