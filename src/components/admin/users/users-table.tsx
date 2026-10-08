import type { AdminUser } from "./user-types";

type Props = {
  users: AdminUser[];
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onChangeStatus: (user: AdminUser) => void;
};

const ROLE_LABELS = {
  ADMIN: "Administrador General",
  LOGISTICS: "Personal de Logística",
};

export function UsersTable({
  users,
  onView,
  onEdit,
  onChangeStatus,
}: Props) {
  return (
    <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <table className="w-full min-w-[1050px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="w-[140px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Identificador
            </th>
            <th className="w-[210px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Nombre completo
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Correo electrónico
            </th>
            <th className="w-[200px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Rol de usuario
            </th>
            <th className="w-[110px] pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Estado
            </th>
            <th className="w-[220px] pb-3 text-right text-xs font-semibold uppercase text-[#7A5055]">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[#E8D8DB] last:border-b-0"
            >
              <td className="py-4 text-sm text-[#5A3A3E]">
                {user.employee_id}
              </td>

              <td className="py-4 text-sm font-medium text-[#2C1A1D]">
                {user.full_name}
              </td>

              <td className="py-4 text-sm text-[#5A3A3E]">
                {user.email}
              </td>

              <td className="py-4 text-sm text-[#5A3A3E]">
                {ROLE_LABELS[user.role]}
              </td>

              <td className="py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "bg-[#F5EBE8] text-[#7A5055]"
                  }`}
                >
                  {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td className="py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onView(user)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled={user.is_current_user}
                    onClick={() => onChangeStatus(user)}
                    className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {user.status === "ACTIVE"
                      ? "Desactivar"
                      : "Reactivar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <p className="py-8 text-center text-sm text-[#7A5055]">
          No se encontraron usuarios.
        </p>
      )}
    </div>
  );
}