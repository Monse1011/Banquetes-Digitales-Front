"use client";

import { Badge, StatusBadge } from "@/components/ui/feedback";
import { DataTable, type Column } from "@/components/ui/layout";
import type {
  EventReportRow,
  PromotionReportRow,
  ReportResult,
  RequestReportRow,
  ServiceReportRow,
} from "@/lib/api/reports";
import { formatDate, formatDateTime, formatPercent } from "@/lib/format";

function stateBadge(status: string) {
  return <Badge tone={status === "ACTIVE" ? "ok" : "neutral"}>{status === "ACTIVE" ? "Vigente" : "No vigente"}</Badge>;
}

const REQUEST_COLUMNS: Column<RequestReportRow>[] = [
  { key: "folio", header: "Folio", render: (row) => <span className="font-mono text-xs text-wine">{row.folio}</span> },
  { key: "client", header: "Cliente", render: (row) => row.client_name },
  { key: "request_date", header: "Recepción", render: (row) => formatDateTime(row.request_date) },
  { key: "event_date", header: "Evento", render: (row) => formatDate(row.event_date) },
  { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
];

const EVENT_COLUMNS: Column<EventReportRow>[] = [
  { key: "folio", header: "Folio", render: (row) => <span className="font-mono text-xs text-wine">{row.folio}</span> },
  { key: "client", header: "Cliente", render: (row) => row.client_name },
  { key: "event_date", header: "Evento", render: (row) => formatDate(row.event_date) },
  {
    key: "services",
    header: "Servicios contratados",
    render: (row) => <span className="text-muted">{row.services?.length ? row.services.join(", ") : "—"}</span>,
  },
  { key: "promotion", header: "Promoción", render: (row) => row.promotion?.name ?? "—" },
];

const SERVICE_COLUMNS: Column<ServiceReportRow>[] = [
  { key: "name", header: "Servicio", render: (row) => <span className="font-medium">{row.name}</span> },
  { key: "status", header: "Estado", render: (row) => stateBadge(row.status) },
  { key: "times", header: "Veces contratado", render: (row) => row.times_contracted },
  { key: "percentage", header: "Participación", render: (row) => formatPercent(row.percentage) },
];

const PROMOTION_COLUMNS: Column<PromotionReportRow>[] = [
  { key: "name", header: "Promoción", render: (row) => <span className="font-medium">{row.name}</span> },
  { key: "status", header: "Estado", render: (row) => stateBadge(row.status) },
  { key: "times", header: "Veces utilizada", render: (row) => row.times_used },
  { key: "percentage", header: "Participación", render: (row) => formatPercent(row.percentage) },
];

/** Tabla de resultados con las columnas que corresponden al tipo de reporte (contrato 13). */
export function ReportTable({ report }: { report: ReportResult }) {
  if (report.type === "REQUESTS") {
    return <DataTable columns={REQUEST_COLUMNS} rows={report.table as RequestReportRow[]} rowKey={(row) => row.folio} />;
  }
  if (report.type === "EVENTS") {
    return <DataTable columns={EVENT_COLUMNS} rows={report.table as EventReportRow[]} rowKey={(row) => row.folio} />;
  }
  if (report.type === "SERVICES") {
    return (
      <DataTable
        columns={SERVICE_COLUMNS}
        rows={report.table as ServiceReportRow[]}
        rowKey={(row) => row.service_id}
      />
    );
  }
  return (
    <DataTable
      columns={PROMOTION_COLUMNS}
      rows={report.table as PromotionReportRow[]}
      rowKey={(row) => row.promotion_id}
    />
  );
}
