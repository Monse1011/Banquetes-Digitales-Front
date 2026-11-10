// Generación y exportación de reportes (contratos 13 a 15 del DAD incremento 4).
import { api, apiBlob } from "./http";

export type ReportType = "REQUESTS" | "EVENTS" | "SERVICES" | "PROMOTIONS";
export type PeriodType = "NONE" | "DAY" | "MONTH" | "RANGE";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  REQUESTS: "Solicitudes de reservación recibidas",
  EVENTS: "Eventos realizados por periodo",
  SERVICES: "Servicios contratados más frecuentes",
  PROMOTIONS: "Promociones utilizadas",
};

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  NONE: "Sin filtro de periodo",
  DAY: "Día",
  MONTH: "Mes",
  RANGE: "Rango de fechas",
};

/** Filtros del panel; solo se envían los aplicables al tipo de reporte elegido. */
export type ReportQuery = {
  type: ReportType;
  period_type?: PeriodType;
  date?: string;
  month?: string;
  from?: string;
  to?: string;
  client_email?: string;
  service_id?: number;
  promotion_id?: number;
};

export type ReportChartBucket = { label: string; count: number };

export type ReportChart = {
  type: "bar" | "line" | "pie";
  x_label: string;
  y_label: string;
  buckets: ReportChartBucket[];
  note?: string | null;
} | null;

export type RequestReportRow = {
  folio: string;
  client_name: string;
  request_date: string;
  event_date: string;
  status: string;
};

export type EventReportRow = {
  folio: string;
  client_name: string;
  event_date: string;
  services: string[];
  promotion: { name: string; status: string } | null;
};

export type ServiceReportRow = {
  service_id: number;
  name: string;
  status: string;
  times_contracted: number;
  percentage: number;
};

export type PromotionReportRow = {
  promotion_id: number;
  name: string;
  status: string;
  times_used: number;
  percentage: number;
};

export type ReportRow = RequestReportRow | EventReportRow | ServiceReportRow | PromotionReportRow;

export type ReportResult = {
  type: ReportType;
  title: string;
  filters: Record<string, unknown>;
  generated_at: string;
  summary: { total: number };
  table: ReportRow[];
  chart: ReportChart;
};

export type ReportClient = { email: string; name: string };

/** Clientes con al menos una solicitud; "Todos los clientes" lo agrega el front (RF-1.2.15.3.12). */
export async function listReportClients(): Promise<ReportClient[]> {
  const raw = await api<{ data: { clients: ReportClient[] } }>("/api/admin/clients");
  return raw?.data?.clients ?? [];
}

export async function getReport(query: ReportQuery): Promise<ReportResult> {
  const raw = await api<{ data: { report: ReportResult } }>("/api/admin/reports", { query: { ...query } });
  return raw.data.report;
}

/** Descarga el .xlsx del reporte mostrado; 404 si no hay resultados (RF-1.2.15.8). */
export function exportReport(query: ReportQuery) {
  return apiBlob("/api/admin/reports/export", { query: { ...query } });
}
