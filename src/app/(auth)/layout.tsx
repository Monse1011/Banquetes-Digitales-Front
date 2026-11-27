import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { LoadingBlock } from "@/components/ui/feedback";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,146,90,0.35),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(122,46,58,0.6),transparent_50%)]" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="font-display text-4xl leading-tight">Cada detalle de tu evento, coordinado en un solo lugar.</p>
          <p className="text-white/70">Portal del personal: solicitudes, recursos, propuestas y calendario.</p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} Banquetes Elegancia · Mérida, Yucatán</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link href="/" className="text-sm text-muted hover:text-wine">
            Ir al sitio público
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Suspense fallback={<LoadingBlock />}>{children}</Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
