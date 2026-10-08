import type { UnifiedResource } from "./resource-types";

type Props = {
  resources: UnifiedResource[];
  onViewDetail: (resource: UnifiedResource) => void;
};

const TYPE_LABELS = {
  HUMAN: "Humano",
  MATERIAL: "Material",
  LOGISTIC: "Logístico",
};

export function UnifiedResourcesTable({
  resources,
  onViewDetail,
}: Props) {
  return (
    <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="w-[130px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Tipo
            </th>

            <th className="w-[150px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Identificador
            </th>

            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Nombre
            </th>

            <th className="w-[130px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Estado
            </th>

            <th className="w-[130px] pb-3 text-right text-xs font-semibold uppercase text-[#7A5055]">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {resources.map((resource) => (
            <tr
              key={`${resource.type}-${resource.id}`}
              className="border-b border-[#E8D8DB] last:border-b-0"
            >
              <td className="py-4 text-sm text-[#5A3A3E]">
                {TYPE_LABELS[resource.type]}
              </td>

              <td className="py-4 text-sm font-medium text-[#6B2737]">
                {resource.identifier}
              </td>

              <td className="py-4 text-sm font-medium text-[#2C1A1D]">
                {resource.name}
              </td>

              <td className="py-4">
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

              <td className="py-4 text-right">
                <button
                  type="button"
                  onClick={() => onViewDetail(resource)}
                  className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resources.length === 0 && (
        <p className="py-8 text-center text-sm text-[#7A5055]">
          No se encontraron recursos.
        </p>
      )}
    </div>
  );
}