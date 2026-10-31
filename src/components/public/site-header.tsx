"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const LINKS = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#preguntas", label: "Preguntas" },
  { href: "/seguimiento", label: "Consultar folio" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Principal">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-wine ${pathname === link.href ? "text-wine" : "text-ink"}`}
            >
              {link.label}
            </Link>
          ))}
          <ButtonLink href="/reservar" size="sm">
            Solicitar cotización
          </ButtonLink>
        </nav>
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-cream-dark md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open ? (
        <nav className="border-t border-line bg-cream px-4 pb-4 md:hidden" aria-label="Principal móvil">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm">
              {link.label}
            </Link>
          ))}
          <ButtonLink href="/reservar" className="mt-2 w-full">
            Solicitar cotización
          </ButtonLink>
        </nav>
      ) : null}
    </header>
  );
}
