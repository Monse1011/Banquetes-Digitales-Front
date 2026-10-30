import Link from "next/link";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label="Banquetes Elegancia, inicio">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border font-display text-lg ${
          light ? "border-gold/70 text-gold" : "border-wine/40 text-wine"
        }`}
      >
        BE
      </span>
      <span className={`font-display text-lg leading-tight ${light ? "text-white" : "text-ink"}`}>
        Banquetes
        <span className={`block text-xs uppercase tracking-[0.25em] ${light ? "text-gold" : "text-gold-dark"}`}>Elegancia</span>
      </span>
    </Link>
  );
}
