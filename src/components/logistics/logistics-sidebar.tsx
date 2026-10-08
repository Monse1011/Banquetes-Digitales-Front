"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

export function LogisticsSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, clearSession } = useAuth();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  const links = [
    {
      href: "/logistics",
      label: "Mis Eventos",
    },
    {
      href: "/logistics/calendario",
      label: "Calendario",
    },
  ];

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-[#E8D8DB] bg-[#FDFAF8]">
      <div className="border-b border-[#E8D8DB] px-5 pb-4 pt-6">
        <p className="text-xs font-semibold uppercase text-[#6B2737]">
          BANQUETES ELEGANCIA
        </p>

        <p className="mt-1 text-[11px] font-medium text-[#7A5055]">
          Panel Logística
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => {
          const isActive =
            link.href === "/logistics"
              ? pathname === "/logistics"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2.5 text-sm ${
                isActive
                  ? "bg-[#F5EBE8] font-medium text-[#6B2737]"
                  : "text-[#5A3A3E]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8D8DB] p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-[#2C1A1D]">
            {user?.full_name ?? "Usuario logístico"}
          </p>

          <p className="text-xs text-[#7A5055]">
            Logística
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded border border-[#E8D8DB] px-3 py-2 text-xs font-medium text-[#7A5055]"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}