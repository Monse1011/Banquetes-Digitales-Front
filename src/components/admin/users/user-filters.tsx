import type { UserRole, UserStatus } from "./user-types";

type Props = {
  search: string;
  role: "all" | UserRole;
  status: "all" | UserStatus;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: "all" | UserRole) => void;
  onStatusChange: (value: "all" | UserStatus) => void;
};

export function UsersFilters({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-1 flex-wrap items-center gap-3">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nombre o correo..."
        className="min-w-[280px] flex-1 rounded border border-[#D4BFC2] bg-[#FDFAF8] px-4 py-2.5 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4]"
      />

      <select
        value={role}
        onChange={(event) =>
          onRoleChange(event.target.value as "all" | UserRole)
        }
        className="w-[180px] rounded border border-[#D4BFC2] bg-[#FDFAF8] px-4 py-2.5 text-sm text-[#2C1A1D]"
      >
        <option value="all">Rol: Todos</option>
        <option value="ADMIN">Administrador General</option>
        <option value="LOGISTICS">Personal de Logística</option>
      </select>

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "all" | UserStatus)
        }
        className="w-[180px] rounded border border-[#D4BFC2] bg-[#FDFAF8] px-4 py-2.5 text-sm text-[#2C1A1D]"
      >
        <option value="all">Estado: Todos</option>
        <option value="ACTIVE">Estado: Activo</option>
        <option value="INACTIVE">Estado: Inactivo</option>
      </select>
    </div>
  );
}