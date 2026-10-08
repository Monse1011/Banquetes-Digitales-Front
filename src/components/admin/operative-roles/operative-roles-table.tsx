import type { OperativeRole } from "./operative-role-types";

type Props = {
  roles: OperativeRole[];
  onEdit: (role: OperativeRole) => void;
  onChangeStatus: (role: OperativeRole) => void;
};

export function OperativeRolesTable({
  roles,
  onEdit,
  onChangeStatus,
}: Props) {
  return (
    <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Nombre del rol
            </th>

            <th className="w-[160px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Estado
            </th>

            <th className="w-[220px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              RH Activos asignados
            </th>

            <th className="w-[180px] pb-3 text-right text-xs font-semibold uppercase text-[#7A5055]">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {roles.map((role) => (
            <tr
              key={role.id}
              className="border-b border-[#E8D8DB] last:border-b-0"
            >
              <td className="py-4 text-sm font-medium text-[#2C1A1D]">
                {role.name}
              </td>

              <td className="py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    role.is_active
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-[#F5EBE8] text-[#7A5055]"
                  }`}
                >
                  {role.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td className="py-4 text-sm text-[#5A3A3E]">
                {role.active_human_resources_count}
              </td>

              <td className="py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(role)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeStatus(role)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    {role.is_active ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {roles.length === 0 && (
        <p className="py-8 text-center text-sm text-[#7A5055]">
          No hay roles operativos registrados.
        </p>
      )}
    </div>
  );
}