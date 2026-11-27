"use client";

import { useState } from "react";
import { Spinner, Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { DetailList } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { getPublicPromotions, type ClientPromotion } from "@/lib/api/client";
import { formatDate, formatPercent } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { SectionEmpty, SectionError, SectionPagination, useClientPage } from "./section-state";

const PER_PAGE = 6;

export function PromotionsSection() {
  const { data, loading, error, reload } = useQuery(getPublicPromotions, "public-promotions");
  const [selected, setSelected] = useState<ClientPromotion | null>(null);
  const pager = useClientPage(data ?? [], PER_PAGE);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );
  }
  if (error) return <SectionError onRetry={reload} />;
  if (!data?.length) return <SectionEmpty icon="percent" />;

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pager.slice.map((promotion) => (
          <li key={promotion.id}>
            <button
              type="button"
              onClick={() => setSelected(promotion)}
              className="h-full w-full rounded-2xl border border-line bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine/10 text-wine">
                  <Icon name="percent" />
                </span>
                <Badge tone="accent">−{formatPercent(promotion.discount_percentage)}</Badge>
              </span>
              <span className="mt-4 block font-display text-lg font-semibold">{promotion.name}</span>
              <span className="mt-2 block text-sm text-muted">{promotion.description}</span>
              <span className="mt-3 block text-xs text-muted">Vigente hasta {formatDate(promotion.valid_until)}</span>
            </button>
          </li>
        ))}
      </ul>
      {pager.hasPages ? <SectionPagination pagination={pager.pagination} onPageChange={pager.onPageChange} /> : null}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? ""} size="sm">
        {selected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">{selected.description}</p>
            <DetailList
              items={[
                { label: "Descuento", value: formatPercent(selected.discount_percentage) },
                { label: "Vigente hasta", value: formatDate(selected.valid_until) },
              ]}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
