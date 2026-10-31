"use client";

import type { ReactNode } from "react";
import { Icon } from "./icon";
import type { Pagination as PaginationData } from "@/lib/api/http";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>{children}</section>;
}

export function CardHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Título de la pestaña del navegador (React 19 lo eleva al <head>). */
export function DocumentTitle({ title }: { title: string }) {
  return <title>{`${title} · Banquetes Elegancia`}</title>;
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6 space-y-2">
      <DocumentTitle title={title} />
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; disabled?: boolean; badge?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto" role="tablist">
      <div className="flex min-w-max gap-1 border-b border-line px-1">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={tab.disabled}
              onClick={() => onChange(tab.value)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active ? "border-wine text-wine" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.badge}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const PER_PAGE_OPTIONS = [10, 25, 50];

export function Pagination({
  pagination,
  onPageChange,
  onPerPageChange,
}: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}) {
  const { page, per_page: perPage, total_records: total } = pagination;
  const pages = Math.max(1, Math.ceil(total / Math.max(perPage, 1)));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-muted">
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-3">
        {onPerPageChange ? (
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Por página</span>
            <select
              className="h-8 rounded-md border border-line bg-white px-2 text-ink"
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-cream disabled:opacity-30"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <span className="px-1 text-ink">
            {page} / {pages}
          </span>
          <button
            type="button"
            className="rounded-md p-1.5 hover:bg-cream disabled:opacity-30"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Oculta la columna en la vista de tarjeta móvil. */
  hideOnMobile?: boolean;
};

/** Tabla en escritorio, tarjetas en móvil. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-5 py-3 font-medium ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-cream/50" : ""}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-5 py-3 align-middle ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`space-y-2 px-5 py-4 ${onRowClick ? "cursor-pointer active:bg-cream/50" : ""}`}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-xs uppercase tracking-wide text-muted">{column.header}</span>
                  <span className="text-right">{column.render(row)}</span>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </>
  );
}
