"use client";

import { useEffect, useState } from "react";
import { OperativeRolesTable } from "@/components/admin/operative-roles/operative-roles-table";
import type { OperativeRole } from "@/components/admin/operative-roles/operative-role-types";
import { getActiveOperativeRoles } from "@/lib/api/operative-roles";

export default function OperativeRolesPage() {
  const [roles, setRoles] = useState<OperativeRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getActiveOperativeRoles(controller.signal).then((result) => {
      if (!controller.signal.aborted) setRoles(result);
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron cargar los roles operativos.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [refresh]);
  return (
    <main className="p-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">Roles Operativos</h1>
          <p className="mt-1 text-sm text-[#7A5055]">Roles activos disponibles para el personal de los banquetes.</p>
        </header>
        <button type="button" disabled={loading} className="self-start text-[#6B2737] underline disabled:opacity-50" onClick={() => {
          setLoading(true); setError(""); setRefresh((value) => value + 1);
        }}>{loading ? "Cargando roles…" : "Actualizar roles"}</button>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        {!loading && !error && <OperativeRolesTable roles={roles} />}
      </section>
    </main>
  );
}
