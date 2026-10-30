// Todas las fechas del negocio están en hora de Mérida (UTC-6, sin horario de verano).
export const TIME_ZONE = "America/Merida";
export const MERIDA_OFFSET = "-06:00";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-12-24" → "24 dic 2026". Las fechas sin hora no se desplazan por zona horaria. */
export function formatDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return "—";
  const date = DATE_ONLY.test(value) ? new Date(`${value}T12:00:00${MERIDA_OFFSET}`) : parseDateTime(value);
  if (!date || Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatLongDate(value: string | null | undefined): string {
  return formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Acepta ISO (`2026-12-24T18:00:00-06:00`) o el formato SQL del calendario (`2026-12-24 18:00:00`, hora local). */
export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const sql = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/.exec(value);
  const date = sql ? new Date(`${sql[1]}T${sql[2]}:${sql[3] ?? "00"}${MERIDA_OFFSET}`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDateTime(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const date = parseDateTime(value);
  return date ? localParts(date).time : value;
}

/** Partes locales (Mérida) de una fecha: { date: "YYYY-MM-DD", time: "HH:mm" }. */
export function localParts(date: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function todayInMerida(): string {
  return localParts(new Date()).date;
}

/** Fecha y hora locales de Mérida → ISO UTC (`2026-12-25T00:00:00.000Z`), como espera POST /api/client/request. */
export function meridaToIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00${MERIDA_OFFSET}`).toISOString();
}

/** Fecha y hora locales → `YYYY-MM-DD HH:mm:ss`, formato de los endpoints de logística. */
export function toSqlDateTime(date: string, time: string): string {
  return `${date} ${time.slice(0, 5)}:00`;
}

/** Cualquier fecha/hora del back → partes locales para inputs `date`/`time`. */
export function toInputParts(value: string | null | undefined): { date: string; time: string } {
  const date = parseDateTime(value);
  return date ? localParts(date) : { date: "", time: "" };
}

/** Suma días a una fecha "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 42 días (6 semanas, lunes a domingo) que cubren el mes indicado (`month` base 0). */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const start = new Date(Date.UTC(year, month, 1 - offset));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function formatMoney(value: number | string | null | undefined, currency = "MXN"): string {
  const amount = Number(value ?? 0);
  if (currency !== "MXN") {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
  }
  return money.format(amount);
}
