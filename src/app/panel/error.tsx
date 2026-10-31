"use client";

import { ErrorScreen } from "@/components/ui/error-screen";

// Se muestra dentro del layout del panel (barra lateral y sesión se conservan).
export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} homeHref="/panel" />;
}
