"use client";

import { useState } from "react";
import { BarChart, LineChart, PieChart, type ChartDatum } from "@/components/reports/charts";
import { ReportTable } from "@/components/reports/report-table";
import { RequirePermission } from "@/components/backstage/shell";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { SelectField, TextField } from "@/components/ui/form";
import { Card, CardHeader, PageHeader } from "@/components/ui/layout";
import { Modal } from "@/components/ui/modal";
import { errorMessage, saveBlob } from "@/lib/api/http";
import { listPromotions } from "@/lib/api/promotions";
import {
  exportReport,
  getReport,
  listReportClients,
  PERIOD_TYPE_LABELS,
  REPORT_TYPE_LABELS,
  type PeriodType,
  type PromotionReportRow,
  type ReportQuery,
  type ReportResult,
  type ReportType,
  type ServiceReportRow,
} from "@/lib/api/reports";
import { listServices } from "@/lib/api/services";
import { formatDateTime, todayInMerida } from "@/lib/format";
import { useQuery } from "@/lib/hooks";

type FilterKind = "period" | "client" | "service" | "promotion";

const FILTERS_BY_TYPE: Record<ReportType, FilterKind[]> = {
  REQUESTS: ["period", "client"],
  EVENTS: ["period", "client", "service", "promotion"],
  SERVICES: ["period", "client", "service"],
  PROMOTIONS: ["period", "client", "promotion"],
};

const SUMMARY_LABELS: Record<ReportType, string> = {
  REQUESTS: "solicitudes recibidas",
  EVENTS: "eventos realizados",
  SERVICES: "contrataciones de servicios",
  PROMOTIONS: "usos de promociones",
};

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const YEARS = Array.from({ length: 12 }, (_, index) => String(Number(todayInMerida().slice(0, 4)) + 1 - index));

function ReportsPanel() {
  const [type, setType] = useState<ReportType | "">("");
  const [periodType, setPeriodType] = useState<PeriodType>("NONE");
  const [date, setDate] = useState("");
  const [monthNum, setMonthNum] = useState("");
  const [yearNum, setYearNum] = useState("");
  const month = monthNum && yearNum ? `${yearNum}-${monthNum}` : "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [promotionId, setPromotionId] = useState("");
  const [periodIssue, setPeriodIssue] = useState("");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [generated, setGenerated] = useState<ReportQuery | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportState, setExportState] = useState<"" | "ok" | "fail">("");
  const [error, setError] = useState("");

  const visible = type ? FILTERS_BY_TYPE[type] : [];
  const show = (kind: FilterKind) => visible.includes(kind);

  const clients = useQuery(listReportClients, "report-clients", show("client"));
  const services = useQuery(() => listServices({ per_page: 100 }), "report-services", show("service"));
  const promotions = useQuery(() => listPromotions({ per_page: 100 }), "report-promotions", show("promotion"));

  /** Cualquier cambio de tipo o filtro retira el reporte mostrado (RF-1.2.15.6.4). */
  const clearReport = () => {
    setReport(null);
    setGenerated(null);
    setError("");
  };

  const buildQuery = (): ReportQuery => {
    const query: ReportQuery = { type: type as ReportType, period_type: periodType };
    if (show("period")) {
      if (periodType === "DAY") query.date = date;
      if (periodType === "MONTH") query.month = month;
      if (periodType === "RANGE") {
        query.from = from;
        query.to = to;
      }
    }
    if (show("client") && clientEmail) query.client_email = clientEmail;
    if (show("service") && serviceId) query.service_id = Number(serviceId);
    if (show("promotion") && promotionId) query.promotion_id = Number(promotionId);
    return query;
  };

  const validatePeriod = (): string => {
    if (periodType === "DAY" && !date) return "Selecciona la fecha del periodo.";
    if (periodType === "MONTH" && !month) return "Selecciona el mes y el año del periodo.";
    if (periodType === "RANGE") {
      if (!from || !to) return "Selecciona las fechas Desde y Hasta.";
      if (from > to) return "El rango seleccionado es inválido.";
    }
    return "";
  };

  const listError =
    (show("client") ? clients.error : null) ?? (show("service") ? services.error : null) ?? (show("promotion") ? promotions.error : null);

  const generate = async () => {
    const issue = validatePeriod();
    setPeriodIssue(issue);
    if (issue || !type || listError) return;
    setBusy(true);
    clearReport();
    try {
      const query = buildQuery();
      const result = await getReport(query);
      setReport(result);
      setGenerated(query);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!generated) return;
    setExporting(true);
    try {
      const { blob, filename } = await exportReport(generated);
      saveBlob(blob, filename ?? "reporte.xlsx");
      setExportState("ok");
    } catch {
      setExportState("fail");
    } finally {
      setExporting(false);
    }
  };

  const hasResults = Boolean(report && report.table.length > 0);

  return (
    <>
      <PageHeader title="Reportes" description="Genera y exporta reportes de solicitudes, eventos, servicios y promociones." />

      <Card className="mb-6">
        <CardHeader title="Panel de filtros" description="Elige el tipo de reporte y los filtros aplicables." />
        <div className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de reporte"
              value={type}
              onChange={(e) => {
                setType(e.target.value as ReportType | "");
                setPeriodIssue("");
                clearReport();
              }}
              required
            >
              <option value="">Selecciona un tipo…</option>
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((value) => (
                <option key={value} value={value}>
                  {REPORT_TYPE_LABELS[value]}
                </option>
              ))}
            </SelectField>
            {show("period") ? (
              <SelectField
                label="Tipo de periodo"
                value={periodType}
                onChange={(e) => {
                  setPeriodType(e.target.value as PeriodType);
                  setPeriodIssue("");
                  clearReport();
                }}
              >
                {(Object.keys(PERIOD_TYPE_LABELS) as PeriodType[]).map((value) => (
                  <option key={value} value={value}>
                    {PERIOD_TYPE_LABELS[value]}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>

          {show("period") && periodType !== "NONE" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {periodType === "DAY" ? (
                <TextField label="Día" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPeriodIssue(""); clearReport(); }} />
              ) : null}
              {periodType === "MONTH" ? (
                <>
                  <SelectField
                    label="Mes"
                    value={monthNum}
                    onChange={(e) => {
                      setMonthNum(e.target.value);
                      setPeriodIssue("");
                      clearReport();
                    }}
                  >
                    <option value="">Selecciona…</option>
                    {MONTH_NAMES.map((name, index) => (
                      <option key={name} value={String(index + 1).padStart(2, "0")}>
                        {name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Año"
                    value={yearNum}
                    onChange={(e) => {
                      setYearNum(e.target.value);
                      setPeriodIssue("");
                      clearReport();
                    }}
                  >
                    <option value="">Selecciona…</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </SelectField>
                </>
              ) : null}
              {periodType === "RANGE" ? (
                <>
                  <TextField label="Desde" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPeriodIssue(""); clearReport(); }} />
                  <TextField label="Hasta" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPeriodIssue(""); clearReport(); }} />
                </>
              ) : null}
              {periodIssue ? <p className="self-end text-xs text-danger">{periodIssue}</p> : null}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            {show("client") ? (
              <SelectField
                label="Cliente"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  clearReport();
                }}
                disabled={clients.loading && !clients.data}
              >
                <option value="">Todos los clientes</option>
                {(clients.data ?? []).map((client) => (
                  <option key={client.email} value={client.email}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </SelectField>
            ) : null}
            {show("service") ? (
              <SelectField
                label="Servicio"
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  clearReport();
                }}
                disabled={services.loading && !services.data}
              >
                <option value="">Todos los servicios</option>
                {(services.data?.items ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                    {service.status === "INACTIVE" ? " (No vigente)" : ""}
                  </option>
                ))}
              </SelectField>
            ) : null}
            {show("promotion") ? (
              <SelectField
                label="Promoción"
                value={promotionId}
                onChange={(e) => {
                  setPromotionId(e.target.value);
                  clearReport();
                }}
                disabled={promotions.loading && !promotions.data}
              >
                <option value="">Todas las promociones</option>
                {(promotions.data?.items ?? []).map((promotion) => (
                  <option key={promotion.id} value={promotion.id}>
                    {promotion.name}
                    {promotion.status === "INACTIVE" ? " (No vigente)" : ""}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>

          {listError ? (
            <Alert
              tone="danger"
              title="No fue posible cargar las listas de filtros"
              action={
                <Button variant="secondary" size="sm" onClick={() => { clients.reload(); services.reload(); promotions.reload(); }}>
                  Reintentar
                </Button>
              }
            >
              {listError.message}
            </Alert>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button icon="file" onClick={generate} loading={busy} disabled={!type || Boolean(listError)}>
              Generar reporte
            </Button>
          </div>
        </div>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {busy ? <LoadingBlock label="Generando reporte…" /> : null}

      {report && !hasResults ? (
        <Card>
          <EmptyState icon="chart" title="No se encontraron resultados para los criterios seleccionados." />
        </Card>
      ) : null}

      {report && hasResults ? (
        <Card>
          <CardHeader
            title={report.title}
            description={`Generado el ${formatDateTime(report.generated_at)} · Total: ${report.summary.total} ${SUMMARY_LABELS[report.type]}`}
            actions={
              <Button variant="secondary" icon="download" onClick={download} loading={exporting}>
                Exportar a Excel
              </Button>
            }
          />
          <div className="space-y-6 p-5">
            <ReportTable report={report} />
            {report.chart ? <ReportChart report={report} /> : null}
          </div>
        </Card>
      ) : null}

      <Modal open={exportState !== ""} onClose={() => setExportState("")} title="Exportar a Excel" size="sm"
        footer={
          <Button onClick={() => setExportState("")}>
            Cerrar
          </Button>
        }
      >
        <p className="text-sm">
          {exportState === "ok"
            ? "Exportación exitosa. El archivo ha sido descargado."
            : "No fue posible exportar el archivo. Intente nuevamente."}
        </p>
      </Modal>
    </>
  );
}

function ReportChart({ report }: { report: ReportResult }) {
  const chart = report.chart;
  if (!chart) return null;
  const data: ChartDatum[] =
    report.type === "SERVICES"
      ? (report.table as ServiceReportRow[]).map((row) => ({ label: row.name, count: row.times_contracted, percentage: row.percentage }))
      : report.type === "PROMOTIONS"
        ? (report.table as PromotionReportRow[]).map((row) => ({ label: row.name, count: row.times_used, percentage: row.percentage }))
        : chart.buckets;

  return (
    <div className="space-y-2">
      {chart.type === "bar" ? <BarChart data={data} xLabel={chart.x_label} yLabel={chart.y_label} /> : null}
      {chart.type === "line" ? <LineChart data={data} xLabel={chart.x_label} yLabel={chart.y_label} /> : null}
      {chart.type === "pie" ? <PieChart data={data} /> : null}
      {chart.note ? <p className="text-xs text-muted">{chart.note}</p> : null}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RequirePermission permission="reports.view">
      <ReportsPanel />
    </RequirePermission>
  );
}
