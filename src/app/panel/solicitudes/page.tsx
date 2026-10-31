"use client";

import { useRouter } from "next/navigation";
import { ErrorState, FilterBar, FilterSelect, SearchInput } from "@/components/backstage/common";
import { RequirePermission } from "@/components/backstage/shell";
import { EmptyState, LoadingBlock, StatusBadge } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { Card, DataTable, PageHeader, Pagination, type Column } from "@/components/ui/layout";
import { listAdminRequests, type AdminRequestSummary } from "@/lib/api/admin-requests";
import { listUsers } from "@/lib/api/users";
import { formatDate, formatTime } from "@/lib/format";
import { useQuery, useUrlFilters } from "@/lib/hooks";
import { REQUEST_STATUSES, statusLabel } from "@/lib/status";

const DEFAULTS = {
  search: "",
  status: "",
  active: "",
  logistic_user_id: "",
  event_date_from: "",
  event_date_to: "",
  page: "1",
  per_page: "10",
};

const COLUMNS: Column<AdminRequestSummary>[] = [
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
  {
    key: "services",
    header: "Servicios",
    hideOnMobile: true,
    className: "max-w-56",
    render: (r) => <span className="line-clamp-2 text-xs text-muted">{r.selected_services.join(", ") || "—"}</span>,
  },
  {
    key: "logistic",
    header: "Responsable",
    render: (r) => (r.logistic_user ? r.logistic_user.full_name : <span className="text-muted">Sin asignar</span>),
  },
  { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
];

function RequestsList() {
  const router = useRouter();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const key = JSON.stringify(filters);
  const { data, error, loading, reload } = useQuery(
    () =>
      listAdminRequests({
        search: filters.search,
        status: filters.status,
        active: filters.active === "true" ? true : undefined,
        logistic_user_id: filters.logistic_user_id,
        event_date_from: filters.event_date_from,
        event_date_to: filters.event_date_to,
        page: Number(filters.page),
        per_page: Number(filters.per_page),
      }),
    key,
  );
  const logistics = useQuery(() => listUsers({ role: "LOGISTICS", per_page: 100 }), "logistics-users");

  return (
    <>
      <PageHeader title="Solicitudes" description="Solicitudes de reservación registradas por los clientes." />
      <Card>
        <FilterBar>
          <SearchInput value={filters.search} onChange={(search) => setFilters({ search })} placeholder="Folio o nombre del cliente" />
          <FilterSelect label="Estado" value={filters.status} onChange={(status) => setFilters({ status })}>
            <option value="">Todos</option>
            {REQUEST_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Responsable" value={filters.logistic_user_id} onChange={(id) => setFilters({ logistic_user_id: id })}>
            <option value="">Todos</option>
            {(logistics.data?.items ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </FilterSelect>
          <TextField
            label="Desde"
            type="date"
            className="w-40 [&_label]:text-xs [&_label]:font-normal [&_label]:text-muted"
            value={filters.event_date_from}
            onChange={(e) => setFilters({ event_date_from: e.target.value })}
          />
          <TextField
            label="Hasta"
            type="date"
            className="w-40 [&_label]:text-xs [&_label]:font-normal [&_label]:text-muted"
            value={filters.event_date_to}
            onChange={(e) => setFilters({ event_date_to: e.target.value })}
          />
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-wine"
              checked={filters.active === "true"}
              onChange={(e) => setFilters({ active: e.target.checked ? "true" : "" })}
            />
            Solo en curso
          </label>
        </FilterBar>
        {loading && !data ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            <DataTable
              columns={COLUMNS}
              rows={data?.items ?? []}
              rowKey={(r) => r.request_id}
              onRowClick={(r) => router.push(`/panel/solicitudes/${r.request_id}`)}
              empty={<EmptyState title="Sin solicitudes">No hay solicitudes que coincidan con los filtros.</EmptyState>}
            />
            {data ? (
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

export default function RequestsPage() {
  return (
    <RequirePermission permission="requests.manage">
      <RequestsList />
    </RequirePermission>
  );
}
