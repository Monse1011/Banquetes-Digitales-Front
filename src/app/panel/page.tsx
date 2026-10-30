"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/layout";
import { useAuth } from "@/lib/auth/auth-context";
import { can, navFor } from "@/lib/auth/permissions";
import { AdminSummary } from "@/components/backstage/admin-summary";

const DESCRIPTIONS: Record<string, string> = {
  "/panel/solicitudes": "Revisa, aprueba y asigna responsable a las solicitudes de los clientes.",
  "/panel/mis-solicitudes": "Coordina recursos, acuerdos y propuestas de los eventos a tu cargo.",
  "/panel/calendario": "Consulta los eventos agendados y su sincronización.",
  "/panel/usuarios": "Administra las cuentas del personal y sus credenciales.",
  "/panel/recursos": "Catálogo de personal, material e insumos logísticos.",
  "/panel/roles-operativos": "Puestos que puede desempeñar el personal operativo.",
};

export default function PanelHome() {
  const { user } = useAuth();
  const items = navFor(user?.role).filter((item) => item.href !== "/panel");
  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader title={`Hola, ${firstName}`} description="¿Qué quieres hacer hoy?" />
      {can(user?.role, "requests.manage") ? <AdminSummary /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-gold hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wine/10 text-wine">
              <Icon name={item.icon} />
            </span>
            <span>
              <span className="flex items-center gap-1 font-medium">
                {item.label}
                <Icon name="arrowRight" className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-sm text-muted">{DESCRIPTIONS[item.href]}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
