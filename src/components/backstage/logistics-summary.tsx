"use client";

import Link from "next/link";
import { Spinner } from "@/components/ui/feedback";
import { listAssignedRequests } from "@/lib/api/logistics";
import { useQuery } from "@/lib/hooks";
import { normalizeStatus, type RequestStatus } from "@/lib/status";

const TILES: { label: string; statuses: RequestStatus[]; filter: string }[] = [
  { label: "Por confirmar recursos", statuses: ["ASSIGNED", "COORDINATION_INCOMPLETE"], filter: "Asignada" },
  { label: "Acuerdos por registrar", statuses: ["COORDINATION_READY", "ADJUSTMENTS_REQUESTED"], filter: "Coordinación Lista" },
  { label: "Esperando al cliente", statuses: ["PROPOSAL_GENERATED", "IN_REVIEW"], filter: "En revisión" },
  { label: "Confirmados", statuses: ["CONFIRMED"], filter: "Confirmado" },
];

export function LogisticsSummary() {
  const { data, loading, error } = useQuery(() => listAssignedRequests({ per_page: 100 }), "logistics-summary");
  if (error) return null;
  const count = (statuses: RequestStatus[]) =>
    (data?.items ?? []).filter((r) => {
      const status = normalizeStatus(r.status);
      return status !== null && statuses.includes(status);
    }).length;

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TILES.map((tile) => (
        <Link
          key={tile.label}
          href={`/panel/mis-solicitudes?status=${encodeURIComponent(tile.filter)}`}
          className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-gold"
        >
          <p className="text-sm text-muted">{tile.label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-wine">{loading ? <Spinner className="h-6 w-6" /> : count(tile.statuses)}</p>
        </Link>
      ))}
    </div>
  );
}
