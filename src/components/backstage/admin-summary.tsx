"use client";

import Link from "next/link";
import { Spinner } from "@/components/ui/feedback";
import { listAdminRequests } from "@/lib/api/admin-requests";
import { useQuery } from "@/lib/hooks";

const TILES = [
  { label: "Pendientes de aprobar", href: "/panel/solicitudes?status=PENDING", filters: { status: "PENDING" } },
  { label: "Aprobadas sin responsable", href: "/panel/solicitudes?status=APPROVED", filters: { status: "APPROVED" } },
  { label: "En curso", href: "/panel/solicitudes?active=true", filters: { active: true } },
  { label: "Esperando al cliente", href: "/panel/solicitudes?status=IN_REVIEW", filters: { status: "IN_REVIEW" } },
];

async function loadCounts(): Promise<number[]> {
  const results = await Promise.all(TILES.map((tile) => listAdminRequests({ ...tile.filters, per_page: 1 })));
  return results.map((result) => result.pagination.total_records);
}

export function AdminSummary() {
  const { data, loading, error } = useQuery(loadCounts, "admin-summary");
  if (error) return null;
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map((tile, index) => (
        <Link key={tile.label} href={tile.href} className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-gold">
          <p className="text-sm text-muted">{tile.label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-wine">{loading ? <Spinner className="h-6 w-6" /> : (data?.[index] ?? 0)}</p>
        </Link>
      ))}
    </div>
  );
}
