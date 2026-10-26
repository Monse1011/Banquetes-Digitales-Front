import type { MaterialResource } from "./resource-types";

type MaterialResourcesTableProps = {
  resources: MaterialResource[];
  onViewDetail: (resource: MaterialResource) => void;
  onEdit: (resource: MaterialResource) => void;
  onChangeStatus: (resource: MaterialResource) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function MaterialResourcesTable({
  resources,
  onViewDetail,
  onEdit,
  onChangeStatus,
}: MaterialResourcesTableProps) {
  if (resources.length === 0) {
    return (
      <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-6 py-10 text-center">
        <p className="text-sm text-[#7A5055]">
          No hay recursos materiales registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <table className="w-full min-w-[850px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="w-[100px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              ID
            </th>

            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Nombre
            </th>

            <th className="w-[130px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Cantidad
            </th>

            <th className="w-[160px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Costo unitario
            </th>

            <th className="w-[120px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Estado
            </th>

            <th className="w-[220px] pb-3 text-right text-xs font-semibold uppercase text-[#7A5055]">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {resources.map((resource) => (
            <tr
              key={resource.id}
              className="border-b border-[#E8D8DB] last:border-b-0"
            >
              <td className="py-4 pr-4 text-[13px] text-[#5A3A3E]">
                {resource.id}
              </td>

              <td className="py-4 pr-4 text-sm font-medium text-[#2C1A1D]">
                {resource.name}
              </td>

              <td className="py-4 pr-4 text-[13px] text-[#5A3A3E]">
                {resource.quantity}
              </td>

              <td className="py-4 pr-4 text-[13px] text-[#5A3A3E]">
                {formatCurrency(resource.unit_cost)}
              </td>

              <td className="py-4 pr-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    resource.is_active
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-[#F5EBE8] text-[#7A5055]"
                  }`}
                >
                  {resource.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td className="py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onViewDetail(resource)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    Ver detalle
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(resource)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeStatus(resource)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#7A5055]"
                  >
                    {resource.is_active ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}