export const SESSION_EXPIRED_EVENT = "banquetes:session-expired";

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Errores por campo (`errors` en 422/400 de validación). */
  get fieldErrors(): FieldErrors {
    const errors = this.payload.errors;
    if (!errors || typeof errors !== "object") return {};
    const result: FieldErrors = {};
    for (const [key, value] of Object.entries(errors)) {
      if (typeof value === "string") result[key] = value;
      else if (Array.isArray(value) && typeof value[0] === "string") result[key] = value[0];
    }
    return result;
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Tu sesión expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No se encontró el recurso solicitado.",
  409: "La operación entra en conflicto con el estado actual.",
  422: "Revisa los datos capturados.",
  423: "Cuenta bloqueada temporalmente.",
  429: "Demasiadas consultas. Espera un minuto e inténtalo de nuevo.",
  500: "Ocurrió un error en el servidor.",
  502: "No fue posible comunicarse con un servicio externo.",
};

/** El back responde `{ message }`, `{ error: "..." }` o `{ error: { message } }`. */
export function extractMessage(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.message === "string" && payload.message) return payload.message;
  const error = payload.error;
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return undefined;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Si es `false`, un 401 no dispara el evento de sesión expirada (p. ej. login). */
  auth?: boolean;
};

export function buildUrl(path: string, query?: RequestOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  if (!path.startsWith("/api/")) throw new Error("La ruta debe pertenecer a /api/.");
  const { body, query, auth = true, ...init } = options;
  const headers = new Headers(init.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor.", 0);
  }

  if (!response.ok) {
    const raw: unknown = await response.json().catch(() => null);
    const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    if (auth && response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(
      extractMessage(payload) ?? STATUS_MESSAGES[response.status] ?? "No fue posible completar la operación.",
      response.status,
      payload,
    );
  }
  return response;
}

/** Petición JSON; devuelve `undefined` en respuestas sin cuerpo (201/204). */
export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

/** Descarga binaria (PDF). */
export async function apiBlob(path: string, options: RequestOptions = {}): Promise<{ blob: Blob; filename?: string }> {
  const response = await send(path, options);
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return { blob: await response.blob(), filename: match ? decodeURIComponent(match[1]) : undefined };
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errorMessage(error: unknown, fallback = "No fue posible completar la operación."): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export type Pagination = { total_records: number; page: number; per_page: number };
export type Paginated<T> = { items: T[]; pagination: Pagination };

export function readPagination(raw: unknown, fallbackCount: number): Pagination {
  const pagination = (raw as { metadata?: { pagination?: Partial<Pagination> } })?.metadata?.pagination;
  return {
    total_records: Number(pagination?.total_records ?? fallbackCount),
    page: Number(pagination?.page ?? 1),
    per_page: Number(pagination?.per_page ?? (fallbackCount || 10)),
  };
}
