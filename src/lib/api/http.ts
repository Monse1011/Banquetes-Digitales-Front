export const SESSION_EXPIRED_EVENT = "banquetes:session-expired";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}
type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  responseType?: "json" | "text" | "blob" | "empty";
  auth?: boolean;
  fallback?: string;
};
export async function apiRequest<T = void>(
  path: string,
  options: Options = {},
): Promise<T> {
  if (!path.startsWith("/api/"))
    throw new Error("La ruta debe pertenecer a /api/.");
  const {
    body,
    responseType = "json",
    auth = true,
    fallback = "No fue posible completar la operación.",
    ...init
  } = options;
  const headers = new Headers(init.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const details =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    if (auth && response.status === 401 && typeof window !== "undefined")
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new ApiError(
      typeof details.message === "string"
        ? details.message
        : typeof details.error === "string"
          ? details.error
          : fallback,
      response.status,
      details,
    );
  }
  if (
    responseType === "empty" ||
    response.status === 204 ||
    response.status === 205
  )
    return undefined as T;
  if (responseType === "blob") return (await response.blob()) as T;
  if (responseType === "text") return (await response.text()) as T;
  return (await response.json()) as T;
}
