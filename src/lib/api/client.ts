// Portal público del cliente (contrato §3).
import { api } from "./http";
import type { ReservationPayload } from "@/lib/validation";

/** Catálogo público de servicios vigentes (contrato 12): nombre, descripción y precio. */
export type ClientService = { id: number; name: string; description: string; price: number };

export async function getServices(): Promise<ClientService[]> {
  const response = await api<{ data: { services: ClientService[] } }>("/api/client/services");
  return response?.data?.services ?? [];
}

/** Catálogo público de promociones vigentes (contrato 11). */
export type ClientPromotion = {
  id: number;
  name: string;
  description: string;
  discount_percentage: number;
  valid_until: string;
};

export async function getPublicPromotions(): Promise<ClientPromotion[]> {
  const response = await api<{ data: { promotions: ClientPromotion[] } }>("/api/client/promotions");
  return response?.data?.promotions ?? [];
}

/** Galería fotográfica de eventos realizados (diagrama Función 3.4). */
export type GalleryPhoto = { id: number; url: string; title?: string | null; alt?: string | null };

export async function getGallery(): Promise<GalleryPhoto[]> {
  const response = await api<{ data: { gallery: GalleryPhoto[] } }>("/api/client/gallery");
  return response?.data?.gallery ?? [];
}

/** Redes sociales con enlace registrado; solo esas se muestran (RF-3.4.1.3). */
export type SocialLink = { network: string; url: string };

export async function getSocialLinks(): Promise<SocialLink[]> {
  const response = await api<{ data: { social_links: SocialLink[] } }>("/api/client/social-links");
  return response?.data?.social_links ?? [];
}

export async function createReservation(payload: ReservationPayload): Promise<string> {
  const response = await api<{ data: { folio: string }[] | { folio: string } }>("/api/client/request", {
    method: "POST",
    body: payload,
  });
  const data = response?.data;
  return Array.isArray(data) ? data[0]?.folio : data?.folio;
}

// El contrato documenta NONE | VIEW | DOWNLOAD; el back responde NONE | INTERACTIVE | PDF_ONLY.
export type ProposalAccess = "NONE" | "VIEW" | "DOWNLOAD" | "INTERACTIVE" | "PDF_ONLY";

/** Detalle consultable con acciones (aceptar / ajustes / rechazar). */
export function canOpenProposal(access: string | null | undefined): boolean {
  return access === "INTERACTIVE" || access === "VIEW";
}

/** Solo el PDF (evento confirmado o finalizado): el detalle responde 404. */
export function isPdfOnly(access: string | null | undefined): boolean {
  return access === "PDF_ONLY" || access === "DOWNLOAD";
}

export type RequestTracking = {
  folio: string;
  client_name: string;
  event_date: string;
  event_address: string;
  guest_count: number;
  status: string;
  status_changed_at: string;
  proposal_access: ProposalAccess;
};

const folioPath = (folio: string) => `/api/client/requests/${encodeURIComponent(folio)}`;

export async function getTracking(folio: string): Promise<RequestTracking> {
  const response = await api<{ data: RequestTracking }>(folioPath(folio));
  return response.data;
}

/** El contrato usa `name`; el back responde `description` y `subtotal`. */
export type ProposalLine = { name?: string; description?: string; quantity: number; unit_cost?: number; subtotal?: number };

export function lineName(line: ProposalLine): string {
  return line.name ?? line.description ?? "—";
}

export function lineAmount(line: ProposalLine): number {
  return line.subtotal ?? (line.unit_cost ?? 0) * line.quantity;
}

export type ClientProposal = {
  proposals_code: string;
  version: number;
  status: string;
  issue_date: string;
  client: { full_name: string; email: string; phone: string };
  event: {
    event_date: string;
    start_time: string;
    end_time: string;
    event_address: string;
    guest_count: number;
  };
  resources: { human: ProposalLine[]; material: ProposalLine[]; logistic: ProposalLine[] };
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  pdf_url: string;
  accepted_at: string | null;
};

export type ProposalAction = "ACCEPT" | "REQUEST_ADJUSTMENTS" | "REJECT";

export type ClientProposalDetail = {
  folio: string;
  request_status: string;
  proposal: ClientProposal;
  available_actions: ProposalAction[];
};

/** OJO: la primera consulta pasa la solicitud de PROPOSAL_GENERATED a IN_REVIEW (contrato §3.4). */
export async function getProposal(folio: string): Promise<ClientProposalDetail> {
  const response = await api<{ data: ClientProposalDetail }>(`${folioPath(folio)}/proposal`);
  return response.data;
}

export type ProposalTransition = {
  folio: string;
  previous_status: string;
  current_status: string;
  proposal_status?: string;
  accepted_at?: string;
  requested_at?: string;
  pdf_url?: string;
};

export async function acceptProposal(folio: string): Promise<ProposalTransition> {
  const response = await api<{ data: ProposalTransition }>(`${folioPath(folio)}/proposal/accept`, {
    method: "POST",
    body: { data: { accepted_terms: true } },
  });
  return response.data;
}

export async function requestAdjustments(folio: string, observations: string): Promise<ProposalTransition> {
  const response = await api<{ data: ProposalTransition }>(`${folioPath(folio)}/proposal/adjustments`, {
    method: "POST",
    body: { data: { observations } },
  });
  return response.data;
}

export async function rejectProposal(folio: string): Promise<ProposalTransition> {
  const response = await api<{ data: ProposalTransition }>(`${folioPath(folio)}/proposal/reject`, {
    method: "POST",
    body: { data: { confirm_rejection: true } },
  });
  return response.data;
}

/** URL del PDF; el navegador la abre directo (pasa por el rewrite de /api). */
export function proposalPdfUrl(folio: string, download = false): string {
  return `${folioPath(folio)}/proposal/pdf${download ? "?download=true" : ""}`;
}
