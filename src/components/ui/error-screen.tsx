"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "./button";
import { Icon } from "./icon";

/** Pantalla para los límites de error de Next (error.tsx). */
export function ErrorScreen({ error, retry, homeHref }: { error: Error & { digest?: string }; retry: () => void; homeHref: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Icon name="alert" className="h-12 w-12 text-danger" />
      <h1 className="font-display text-2xl font-semibold">Algo salió mal</h1>
      <p className="text-sm text-muted">Ocurrió un error inesperado al mostrar esta página. Puedes intentarlo de nuevo.</p>
      {error.digest ? <p className="font-mono text-xs text-muted">Referencia: {error.digest}</p> : null}
      <div className="flex gap-2">
        <Button onClick={retry}>Reintentar</Button>
        <ButtonLink href={homeHref} variant="secondary">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
