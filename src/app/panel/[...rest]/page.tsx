import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DocumentTitle } from "@/components/ui/layout";

// Rutas inexistentes bajo /panel: 404 dentro del backstage, sin perder la navegación.
export default function PanelNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <DocumentTitle title="Página no encontrada" />
      <Icon name="search" className="h-12 w-12 text-gold" />
      <h1 className="font-display text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted">La sección que buscas no existe en el panel.</p>
      <ButtonLink href="/panel">Volver al inicio</ButtonLink>
    </div>
  );
}
