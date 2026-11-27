"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { getGallery } from "@/lib/api/client";
import { useQuery } from "@/lib/hooks";
import { SectionEmpty, SectionError, SectionPagination, useClientPage } from "./section-state";

const PER_PAGE = 8;

export function GallerySection() {
  const { data, loading, error, reload } = useQuery(getGallery, "gallery");
  const [index, setIndex] = useState<number | null>(null);
  const pager = useClientPage(data ?? [], PER_PAGE);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );
  }
  if (error) return <SectionError onRetry={reload} />;
  if (!data?.length) return <SectionEmpty icon="eye" />;

  const current = index === null ? null : (data[index] ?? null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {pager.slice.map((photo) => {
          const position = data.indexOf(photo);
          return (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setIndex(position)}
                className="block w-full overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                aria-label={`Ampliar fotografía ${photo.title ?? photo.alt ?? "de evento realizado"}`}
              >
                <img
                  src={photo.url}
                  alt={photo.alt ?? photo.title ?? "Fotografía de evento realizado"}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover"
                />
              </button>
            </li>
          );
        })}
      </ul>
      {pager.hasPages ? <SectionPagination pagination={pager.pagination} onPageChange={pager.onPageChange} /> : null}

      <Modal
        open={current !== null}
        onClose={() => setIndex(null)}
        title={current?.title ?? "Galería"}
        size="xl"
        footer={
          index !== null ? (
            <>
              <Button variant="secondary" icon="chevronLeft" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index <= 0}>
                Anterior
              </Button>
              <span className="self-center text-sm text-muted">
                {index + 1} / {data.length}
              </span>
              <Button
                variant="secondary"
                icon="chevronRight"
                onClick={() => setIndex(Math.min(data.length - 1, index + 1))}
                disabled={index >= data.length - 1}
              >
                Siguiente
              </Button>
            </>
          ) : null
        }
      >
        {current ? (
          <img
            src={current.url}
            alt={current.alt ?? current.title ?? "Fotografía de evento realizado"}
            className="max-h-[65vh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Modal>
    </>
  );
}
