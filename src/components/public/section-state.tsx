"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/layout";

export const SECTION_EMPTY_MESSAGE = "Actualmente no hay elementos disponibles.";
export const SECTION_ERROR_MESSAGE = "No fue posible cargar la información de esta sección. Intente nuevamente más tarde.";

/** Error de carga acotado a la sección, sin bloquear el resto del contenido (RF-3.4.1.2.8). */
export function SectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert
      tone="warn"
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        ) : undefined
      }
    >
      {SECTION_ERROR_MESSAGE}
    </Alert>
  );
}

export function SectionEmpty({ icon = "sparkle" }: { icon?: string }) {
  return <EmptyState icon={icon} title={SECTION_EMPTY_MESSAGE} />;
}

/** Paginación en el cliente para cuando los elementos exceden el espacio de la sección (RF-3.4.1.2.6). */
export function useClientPage<T>(items: T[], perPage: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, pages);
  return {
    slice: items.slice((current - 1) * perPage, current * perPage),
    pagination: { total_records: items.length, page: current, per_page: perPage },
    onPageChange: setPage,
    hasPages: items.length > perPage,
  };
}

export function SectionPagination({
  pagination,
  onPageChange,
}: {
  pagination: { total_records: number; page: number; per_page: number };
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
