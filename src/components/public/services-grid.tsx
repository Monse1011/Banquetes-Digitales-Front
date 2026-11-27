"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { DetailList } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { getServices, type ClientService } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { FALLBACK_SERVICE, SERVICE_DETAILS } from "./content";
import { SectionEmpty, SectionError, SectionPagination, useClientPage } from "./section-state";

const PER_PAGE = 8;

export function ServicesGrid() {
  const { data, loading, error, reload } = useQuery(getServices, "services");
  const [selected, setSelected] = useState<ClientService | null>(null);
  const pager = useClientPage(data ?? [], PER_PAGE);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );
  }
  if (error) return <SectionError onRetry={reload} />;
  if (!data?.length) return <SectionEmpty icon="cloche" />;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pager.slice.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              onClick={() => setSelected(service)}
              className="h-full w-full rounded-2xl border border-line bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Icon name={SERVICE_DETAILS[service.id]?.icon ?? FALLBACK_SERVICE.icon} />
              </span>
              <span className="block font-display text-lg font-semibold">{service.name}</span>
              <span className="mt-2 block text-sm text-muted">{service.description}</span>
              <span className="mt-3 block text-sm font-medium text-wine">Desde {formatMoney(service.price)}</span>
            </button>
          </li>
        ))}
      </ul>
      {pager.hasPages ? <SectionPagination pagination={pager.pagination} onPageChange={pager.onPageChange} /> : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        size="sm"
        footer={
          <ButtonLink href="/reservar" variant="gold">
            Solicitar cotización
          </ButtonLink>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">{selected.description}</p>
            <DetailList items={[{ label: "Precio", value: formatMoney(selected.price) }]} />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
