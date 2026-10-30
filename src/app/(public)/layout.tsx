import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { BUSINESS } from "@/components/public/content";
import { SiteHeader } from "@/components/public/site-header";
import { LoadingBlock } from "@/components/ui/feedback";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<LoadingBlock />}>{children}</Suspense>
      </main>
      <footer className="bg-ink text-white/70">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
          <div className="space-y-3">
            <Logo light />
            <p className="text-sm">{BUSINESS.tagline}.</p>
          </div>
          <div className="space-y-1 text-sm">
            <p className="mb-2 font-medium text-white">Contacto</p>
            <p>{BUSINESS.phone}</p>
            <p>{BUSINESS.email}</p>
            <p>{BUSINESS.address}</p>
            <p>{BUSINESS.hours}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-2 font-medium text-white">Clientes</p>
            <Link href="/reservar" className="block hover:text-gold">
              Solicitar cotización
            </Link>
            <Link href="/seguimiento" className="block hover:text-gold">
              Consultar mi folio
            </Link>
            <Link href="/acceso" className="block hover:text-gold">
              Acceso del personal
            </Link>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {BUSINESS.name}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
