import type { AdminUser } from "./user-types";

type Props = {
  user: AdminUser;
  onClose: () => void;
};

const ROLE_LABELS = {
  ADMIN: "Administrador General",
  LOGISTICS: "Personal de Logística",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UserDetailModal({
  user,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <section className="w-full max-w-[620px] overflow-hidden rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] shadow-[0_10px_24px_rgba(0,0,0,0.17)]">
        <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#2C1A1D]">
              Detalle del Usuario
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              {user.employee_id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-lg text-[#7A5055]"
          >
            ×
          </button>
        </header>

        <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
          <Field
            label="Identificador"
            value={user.employee_id}
          />

          <Field
            label="Nombre completo"
            value={user.full_name}
          />

          <Field
            label="Correo electrónico"
            value={user.email}
          />

          <Field
            label="Rol"
            value={ROLE_LABELS[user.role]}
          />

          <Field
            label="Estado"
            value={
              user.status === "ACTIVE"
                ? "Activo"
                : "Inactivo"
            }
          />

          <Field
            label="Último acceso"
            value={formatDate(user.last_access)}
          />

          <Field
            label="Fecha de registro"
            value={formatDate(user.created_at)}
          />

          <Field
            label="Última modificación"
            value={formatDate(user.updated_at)}
          />
        </div>

        <footer className="flex justify-end border-t border-[#E8D8DB] p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#E8D8DB] px-5 py-2.5 text-sm font-medium text-[#6B2737]"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-[#7A5055]">
        {label}
      </p>

      <p className="text-sm font-medium text-[#2C1A1D]">
        {value}
      </p>
    </div>
  );
}