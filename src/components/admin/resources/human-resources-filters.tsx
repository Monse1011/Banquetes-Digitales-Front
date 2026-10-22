import type { OperativeRoleOption } from "./resource-types";

type HumanResourcesFiltersProps = {
  search: string;
  status: "all" | "active" | "inactive";
  roleId: string;
  operativeRoles: OperativeRoleOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  onRoleChange: (value: string) => void;
};

export function HumanResourcesFilters({
  search,
  status,
  roleId,
  operativeRoles,
  onSearchChange,
  onStatusChange,
  onRoleChange,
}: HumanResourcesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por nombre..."
        className="w-[280px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
      />

      <select
        value={status}
        onChange={(event) =>
          onStatusChange(
            event.target.value as "all" | "active" | "inactive",
          )
        }
        className="w-[160px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
      >
        <option value="all">Estado: Todos</option>
        <option value="active">Estado: Activo</option>
        <option value="inactive">Estado: Inactivo</option>
      </select>

      <select
        value={roleId}
        onChange={(event) => onRoleChange(event.target.value)}
        className="w-[190px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D] outline-none focus:border-[#6B2737]"
      >
        <option value="">Rol operativo: Todos</option>

        {operativeRoles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </div>
  );
}