"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { DocumentTitle } from "@/components/ui/layout";
import { FOLIO_REGEX } from "@/lib/validation";

export default function ConfirmationPage() {
  const folio = useSearchParams().get("folio") ?? "";
  const [copied, setCopied] = useState(false);
  const valid = FOLIO_REGEX.test(folio);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(folio);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <DocumentTitle title="Solicitud recibida" />
      {valid ? (
        <>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-ok">
            <Icon name="check" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold">¡Recibimos tu solicitud!</h1>
          <p className="mt-3 text-muted">
            Guarda tu folio: lo necesitarás para consultar el estado de tu evento y revisar tu propuesta.
          </p>
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Tu folio</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-wider text-wine">{folio}</p>
            <Button variant="secondary" size="sm" icon={copied ? "check" : "copy"} className="mt-4" onClick={copy}>
              {copied ? "Copiado" : "Copiar folio"}
            </Button>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={`/seguimiento/${folio}`}>Ver estado de mi solicitud</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Volver al inicio
            </ButtonLink>
          </div>
        </>
      ) : (
        <Alert tone="warn" title="No encontramos un folio">
          Si ya enviaste tu solicitud, consulta tu folio desde{" "}
          <Link href="/seguimiento" className="underline">
            seguimiento
          </Link>
          .
        </Alert>
      )}
    </div>
  );
}
