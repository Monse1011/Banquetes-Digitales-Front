"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

const navigationItems = [
  {
    label: "Solicitudes",
    href: "/admin",
  },
  {
    label: "Asignación de Eventos",
    href: "/admin/asignacion-eventos",
  },
  {
    label: "Recursos",
    href: "/admin/recursos",
  },
  {
    label: "Roles Operativos",
    href: "/admin/roles-operativos",
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
  },
  {
    label: "Calendario",
    href: "/admin/calendario",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useAuth();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col border-r border-[#E8D8DB] bg-[#FDFAF8]">
      <header className="border-b border-[#E8D8DB] px-5 pt-6 pb-4">
        <p className="text-xs font-semibold uppercase text-[#6B2737]">
          Banquetes Elegancia
        </p>
        <p className="mt-1 text-[11px] font-medium text-[#7A5055]">
          Panel Admin
        </p>
      </header>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-[#F5EBE8] font-medium text-[#6B2737]"
                  : "font-normal text-[#5A3A3E] hover:bg-[#F5EBE8]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <footer className="border-t border-[#E8D8DB] p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-[#2C1A1D]">
            {user?.full_name ?? "Administrador"}
          </p>
          <p className="mt-0.5 text-xs text-[#7A5055]">Administrador</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded border border-[#E8D8DB] px-3 py-2 text-xs font-medium text-[#7A5055] transition-colors hover:bg-[#F5EBE8]"
        >
          Cerrar sesión
        </button>
      </footer>
    </aside>
  );
}