import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-display text-6xl text-wine">404</p>
      <h1 className="font-display text-2xl font-semibold">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-muted">La página que buscas no existe o fue movida.</p>
      <ButtonLink href="/">Volver al inicio</ButtonLink>
    </main>
  );
}
