"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FOLIO_REGEX, normalizeFolio } from "@/lib/validation";

export function FolioLookup({ dark = false, initial = "" }: { dark?: boolean; initial?: string }) {
  const router = useRouter();
  const [folio, setFolio] = useState(initial);
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = normalizeFolio(folio);
    if (!FOLIO_REGEX.test(value)) {
      setError("El folio tiene el formato BD-AAAA-00000 (por ejemplo BD-2026-00001).");
      return;
    }
    setError("");
    router.push(`/seguimiento/${value}`);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor="folio-lookup" className="sr-only">
        Folio
      </label>
      <div className="flex gap-2">
        <input
          id="folio-lookup"
          value={folio}
          onChange={(event) => setFolio(event.target.value)}
          placeholder="BD-2026-00001"
          autoComplete="off"
          aria-invalid={Boolean(error) || undefined}
          className={`h-11 min-w-0 flex-1 rounded-lg border px-3 font-mono text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-gold/40 ${
            dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/40" : "border-line bg-white text-ink"
          }`}
        />
        <Button type="submit" variant={dark ? "gold" : "primary"} size="lg" icon="search">
          Consultar
        </Button>
      </div>
      {error ? <p className={`text-xs ${dark ? "text-red-200" : "text-danger"}`}>{error}</p> : null}
    </form>
  );
}
