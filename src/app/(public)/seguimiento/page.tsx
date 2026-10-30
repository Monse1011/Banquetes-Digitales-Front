"use client";

import { useSearchParams } from "next/navigation";
import { FolioLookup } from "@/components/public/folio-lookup";
import { Icon } from "@/components/ui/icon";

export default function TrackingSearchPage() {
  const initial = useSearchParams().get("folio") ?? "";
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-wine/10 text-wine">
          <Icon name="search" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">Consulta tu solicitud</h1>
        <p className="mt-2 text-muted">Ingresa el folio que recibiste al enviar tu solicitud.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <FolioLookup initial={initial} />
      </div>
    </div>
  );
}
