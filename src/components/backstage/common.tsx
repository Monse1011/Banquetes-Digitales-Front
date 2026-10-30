"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { useDebounced } from "@/lib/hooks";

/** Búsqueda por texto que notifica con retraso para no disparar una petición por tecla. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  label = "Buscar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [text, setText] = useState(value);
  const debounced = useDebounced(text);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // Solo reacciona al texto ya estabilizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">{children}</div>;
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-36 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:border-gold focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted hover:text-wine">
      <Icon name="arrowLeft" className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Icon name="alert" className="h-10 w-10 text-danger" />
      <p className="text-sm text-muted">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm font-medium text-wine hover:underline">
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
