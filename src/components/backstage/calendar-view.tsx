"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/backstage/common";
import { Badge, EmptyState, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/layout";
import { isSynced, listCalendarEvents, type CalendarEvent, type CalendarScope } from "@/lib/api/calendar";
import { formatLongDate, formatTime, todayInMerida } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { normalizeStatus } from "@/lib/status";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
// Sin filtro de rango en el contrato: se trae el calendario completo y se agrupa por día.
const ALL_EVENTS = 500;

const dayOf = (event: CalendarEvent) => event.start_datetime.slice(0, 10);

function monthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const start = new Date(Date.UTC(year, month, 1 - offset));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function SyncBadge({ status }: { status: string }) {
  return isSynced(status) ? <Badge tone="ok">Sincronizado</Badge> : <Badge tone="warn">Pendiente de sincronizar</Badge>;
}

export function CalendarView({
  scope,
  detailHref,
  renderActions,
  refreshKey = 0,
}: {
  scope: CalendarScope;
  detailHref: (event: CalendarEvent) => string;
  renderActions?: (event: CalendarEvent) => ReactNode;
  refreshKey?: number;
}) {
  const today = todayInMerida();
  const [cursor, setCursor] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const { data, error, loading, reload } = useQuery(
    () => listCalendarEvents(scope, { include_cancelled: includeCancelled, per_page: ALL_EVENTS }),
    `${scope}-${includeCancelled}-${refreshKey}`,
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of data?.items ?? []) {
      const list = map.get(dayOf(event)) ?? [];
      list.push(event);
      map.set(dayOf(event), list);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
    return map;
  }, [data]);

  const days = monthGrid(cursor.year, cursor.month);
  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(cursor.year, cursor.month, 1)),
  );
  const upcoming = (data?.items ?? [])
    .filter((event) => dayOf(event) >= today && normalizeStatus(event.status) !== "CANCELED")
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
    .slice(0, 5);
  const dayEvents = byDay.get(selected) ?? [];

  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });

  if (loading && !data) return <LoadingBlock />;
  if (error && !data) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(-1)} className="rounded-lg p-1.5 hover:bg-cream" aria-label="Mes anterior">
              <Icon name="chevronLeft" />
            </button>
            <h2 className="min-w-44 text-center font-display text-lg font-semibold first-letter:uppercase">{monthLabel}</h2>
            <button type="button" onClick={() => move(1)} className="rounded-lg p-1.5 hover:bg-cream" aria-label="Mes siguiente">
              <Icon name="chevronRight" />
            </button>
            <button
              type="button"
              className="ml-2 rounded-lg border border-line px-3 py-1 text-xs hover:bg-cream"
              onClick={() => {
                setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
                setSelected(today);
              }}
            >
              Hoy
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-wine" checked={includeCancelled} onChange={(e) => setIncludeCancelled(e.target.checked)} />
            Mostrar cancelados
          </label>
        </div>
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-medium uppercase tracking-wide text-muted">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const events = byDay.get(day) ?? [];
            const inMonth = day.startsWith(monthKey);
            const isSelected = day === selected;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                aria-pressed={isSelected}
                aria-label={`${formatLongDate(day)}, ${events.length} eventos`}
                className={`flex min-h-16 flex-col items-stretch gap-1 border-b border-r border-line p-1.5 text-left transition sm:min-h-24 ${
                  inMonth ? "bg-white" : "bg-cream/40 text-muted"
                } ${isSelected ? "ring-2 ring-inset ring-wine" : "hover:bg-cream/60"}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    day === today ? "bg-wine font-semibold text-white" : ""
                  }`}
                >
                  {Number(day.slice(8))}
                </span>
                {events.slice(0, 2).map((event) => (
                  <span
                    key={event.event_id}
                    className={`hidden truncate rounded px-1.5 py-0.5 text-[11px] sm:block ${
                      normalizeStatus(event.status) === "CANCELED" ? "bg-red-50 text-red-700 line-through" : "bg-wine/10 text-wine"
                    }`}
                  >
                    {formatTime(event.start_datetime)} {event.folio}
                  </span>
                ))}
                {events.length > 2 ? <span className="hidden text-[11px] text-muted sm:block">+{events.length - 2} más</span> : null}
                {events.length > 0 ? <span className="mx-auto h-1.5 w-1.5 rounded-full bg-wine sm:hidden" /> : null}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold first-letter:uppercase">{formatLongDate(selected)}</h2>
            <p className="text-xs text-muted">{dayEvents.length ? `${dayEvents.length} evento(s)` : "Sin eventos"}</p>
          </div>
          {dayEvents.length === 0 ? (
            <EmptyState icon="calendar" title="Día libre" />
          ) : (
            <ul className="divide-y divide-line">
              {dayEvents.map((event) => (
                <EventItem key={event.event_id} event={event} href={detailHref(event)} actions={renderActions?.(event)} />
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Próximos eventos</h2>
          </div>
          {upcoming.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No hay eventos próximos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((event) => (
                <li key={event.event_id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm hover:bg-cream/50"
                    onClick={() => {
                      setSelected(dayOf(event));
                      setCursor({ year: Number(event.start_datetime.slice(0, 4)), month: Number(event.start_datetime.slice(5, 7)) - 1 });
                    }}
                  >
                    <span>
                      <span className="font-mono text-xs text-wine">{event.folio}</span>
                      <span className="block text-xs text-muted">{event.location}</span>
                    </span>
                    <span className="text-right text-xs">
                      {formatLongDate(dayOf(event)).replace(/ de \d{4}$/, "")}
                      <span className="block text-muted">{formatTime(event.start_datetime)} h</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function EventItem({ event, href, actions }: { event: CalendarEvent; href: string; actions?: ReactNode }) {
  return (
    <li className="space-y-2 px-5 py-4 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={href} className="font-mono text-xs font-semibold text-wine hover:underline">
            {event.folio}
          </Link>
          <p className="font-medium">{event.title}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <p className="flex items-center gap-1.5 text-muted">
        <Icon name="clock" className="h-4 w-4" />
        {formatTime(event.start_datetime)} – {formatTime(event.end_datetime)} h
      </p>
      <p className="flex items-center gap-1.5 text-muted">
        <Icon name="pin" className="h-4 w-4" />
        {event.location}
      </p>
      {event.logistics_responsible ? (
        <p className="flex items-center gap-1.5 text-muted">
          <Icon name="user" className="h-4 w-4" />
          {event.logistics_responsible.full_name}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SyncBadge status={event.sync_status} />
        {actions}
      </div>
    </li>
  );
}
