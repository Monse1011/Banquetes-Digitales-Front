"use client";

import { Alert, Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { getServices } from "@/lib/api/client";
import { useQuery } from "@/lib/hooks";
import { FALLBACK_SERVICE, SERVICE_DETAILS } from "./content";

export function ServicesGrid() {
  const { data, loading, error } = useQuery(getServices, "services");

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );
  }
  if (error) return <Alert tone="warn">No pudimos cargar el catálogo de servicios en este momento.</Alert>;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(data ?? []).map((service) => {
        const detail = SERVICE_DETAILS[service.id] ?? FALLBACK_SERVICE;
        return (
          <li key={service.id} className="rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Icon name={detail.icon} />
            </span>
            <h3 className="font-display text-lg font-semibold">{service.nombre}</h3>
            <p className="mt-2 text-sm text-muted">{detail.description}</p>
          </li>
        );
      })}
    </ul>
  );
}
