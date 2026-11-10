"use client";

import { useRouter } from "next/navigation";
import { ErrorState, FilterBar, FilterSelect } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { EmptyState, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { Card, DataTable, PageHeader, Pagination, Tabs, type Column } from "@/components/ui/layout";
import { listAssignedHistory, listAssignedRequests, type AssignedRequestSummary } from "@/lib/api/logistics";
import { formatDate, formatTime } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";

type Tab = "active" | "history";

// El back filtra por la etiqueta en español del estado.
const ACTIVE_STATUSES = [
  "Asignada",
  "Coordinación Incompleta",
  "Coordinación Lista",
  "Propuesta generada",
  "En revisión",
  "Ajustes Solicitados",
  "Confirmado",
];
const HISTORY_STATUSES = [
  { value: "Finalizado", label: "Finalizado" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "REJECTED", label: "Rechazada" },
];

const DEFAULTS = { tab: "active", status: "", page: "1", per_page: "10" };

const COLUMNS: Column<AssignedRequestSummary>[] = [
  { key: "folio", header: "Folio", render: (r) => <span className="font-mono text-xs font-semibold text-wine">{r.folio}</span> },
  {
    key: "client",
    header: "Cliente",
    render: (r) => (
      <div>
        <p className="font-medium">{r.client_name}</p>
        <p className="text-xs text-muted">{r.client_email}</p>
      </div>
    ),
  },
  {
    key: "event",
    header: "Evento",
    render: (r) => (
      <div>
        <p>{formatDate(r.event_date)}</p>
        <p className="text-xs text-muted">
          {formatTime(r.start_time)}–{formatTime(r.end_time)} · {r.guest_count} invitados
        </p>
      </div>
    ),
  },
  { key: "address", header: "Lugar", hideOnMobile: true, render: (r) => <span className="text-sm text-muted">{r.event_address}</span> },
  { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
];

function MyRequests() {
  const router = useRouter();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const tab = filters.tab as Tab;
  const { data, error, loading, reload } = useQuery(() => {
    const query = { status: filters.status, page: Number(filters.page), per_page: Number(filters.per_page) };
    return tab === "history" ? listAssignedHistory(query) : listAssignedRequests(query);
  }, JSON.stringify(filters));

  return (
    <>
      <PageHeader title="Mis solicitudes" description="Eventos que tienes asignados como responsable de logística." />
      <Card>
        <div className="px-5 pt-3">
          <Tabs<Tab>
            value={tab}
            onChange={(value) => setFilters({ tab: value, status: "" })}
            tabs={[
              { value: "active", label: "Activas" },
              { value: "history", label: "Historial" },
            ]}
          />
        </div>
        <FilterBar>
          <FilterSelect label="Estado" value={filters.status} onChange={(status) => setFilters({ status })}>
            <option value="">Todos</option>
            {tab === "history"
              ? HISTORY_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))
              : ACTIVE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
          </FilterSelect>
        </FilterBar>
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <div className={loading ? "opacity-60" : ""}>
            <DataTable
              columns={COLUMNS}
              rows={data?.items ?? []}
              rowKey={(r) => r.request_id}
              onRowClick={(r) => router.push(`/panel/mis-solicitudes/${r.request_id}`)}
              empty={
                <EmptyState icon="clipboard" title={tab === "history" ? "Sin historial" : "Sin solicitudes asignadas"}>
                  {data?.message ?? (tab === "history" ? "Aún no tienes eventos concluidos." : "Cuando un administrador te asigne un evento aparecerá aquí.")}
                </EmptyState>
              }
            />
            {data && data.items.length > 0 ? (
              <Pagination
                pagination={data.pagination}
                onPageChange={(page) => setFilters({ page: String(page) }, false)}
                onPerPageChange={(perPage) => setFilters({ per_page: String(perPage) })}
              />
            ) : null}
          </div>
        )}
      </Card>
    </>
  );
}

export default function MyRequestsPage() {
  return (
    <RequirePermission permission="logistics.operate">
      <MyRequests />
    </RequirePermission>
  );
}
