// Estados de la solicitud de reservación (contrato §6). El back expone el enum en admin/cliente
// y la etiqueta en español en logística; aquí todo se normaliza al enum canónico.

export const REQUEST_STATUSES = [
  "PENDING",
  "APPROVED",
  "ASSIGNED",
  "COORDINATION_READY",
  "COORDINATION_INCOMPLETE",
  "PROPOSAL_GENERATED",
  "IN_REVIEW",
  "ADJUSTMENTS_REQUESTED",
  "CONFIRMED",
  "FINALIZED",
  "CANCELED",
  "REJECTED",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const LABELS: Record<RequestStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  ASSIGNED: "Asignada",
  COORDINATION_READY: "Coordinación lista",
  COORDINATION_INCOMPLETE: "Coordinación incompleta",
  PROPOSAL_GENERATED: "Propuesta generada",
  IN_REVIEW: "En revisión",
  ADJUSTMENTS_REQUESTED: "Ajustes solicitados",
  CONFIRMED: "Confirmado",
  FINALIZED: "Finalizado",
  CANCELED: "Cancelado",
  REJECTED: "Rechazada",
};

/** Etiquetas para el cliente final (menos jerga interna). */
const CLIENT_LABELS: Record<RequestStatus, string> = {
  PENDING: "Solicitud recibida",
  APPROVED: "Solicitud aprobada",
  ASSIGNED: "En planeación",
  COORDINATION_READY: "En planeación",
  COORDINATION_INCOMPLETE: "En planeación",
  PROPOSAL_GENERATED: "Propuesta lista para revisar",
  IN_REVIEW: "Propuesta en revisión",
  ADJUSTMENTS_REQUESTED: "Ajustes en proceso",
  CONFIRMED: "Evento confirmado",
  FINALIZED: "Evento finalizado",
  CANCELED: "Cancelado",
  REJECTED: "Propuesta rechazada",
};

export type Tone = "neutral" | "info" | "ok" | "warn" | "danger" | "accent";

const TONES: Record<RequestStatus, Tone> = {
  PENDING: "warn",
  APPROVED: "info",
  ASSIGNED: "info",
  COORDINATION_READY: "ok",
  COORDINATION_INCOMPLETE: "warn",
  PROPOSAL_GENERATED: "accent",
  IN_REVIEW: "accent",
  ADJUSTMENTS_REQUESTED: "warn",
  CONFIRMED: "ok",
  FINALIZED: "neutral",
  CANCELED: "danger",
  REJECTED: "danger",
};

const ALIASES: Record<string, RequestStatus> = {
  CANCELLED: "CANCELED",
  FINISHED: "FINALIZED",
  PENDIENTE: "PENDING",
  APROBADA: "APPROVED",
  ASIGNADA: "ASSIGNED",
  "COORDINACIÓN LISTA": "COORDINATION_READY",
  "COORDINACION LISTA": "COORDINATION_READY",
  "COORDINACIÓN INCOMPLETA": "COORDINATION_INCOMPLETE",
  "COORDINACION INCOMPLETA": "COORDINATION_INCOMPLETE",
  "PROPUESTA GENERADA": "PROPOSAL_GENERATED",
  "EN REVISIÓN": "IN_REVIEW",
  "EN REVISION": "IN_REVIEW",
  "AJUSTES SOLICITADOS": "ADJUSTMENTS_REQUESTED",
  CONFIRMADO: "CONFIRMED",
  CONFIRMADA: "CONFIRMED",
  FINALIZADO: "FINALIZED",
  FINALIZADA: "FINALIZED",
  CANCELADO: "CANCELED",
  CANCELADA: "CANCELED",
  RECHAZADA: "REJECTED",
  RECHAZADO: "REJECTED",
};

export function normalizeStatus(value: string | null | undefined): RequestStatus | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if ((REQUEST_STATUSES as readonly string[]).includes(upper)) return upper as RequestStatus;
  return ALIASES[upper] ?? null;
}

export function statusLabel(value: string | null | undefined): string {
  const status = normalizeStatus(value);
  return status ? LABELS[status] : (value ?? "—");
}

export function clientStatusLabel(value: string | null | undefined): string {
  const status = normalizeStatus(value);
  return status ? CLIENT_LABELS[status] : (value ?? "—");
}

export function statusTone(value: string | null | undefined): Tone {
  const status = normalizeStatus(value);
  return status ? TONES[status] : "neutral";
}

const is = (list: RequestStatus[]) => (value: string | null | undefined) => {
  const status = normalizeStatus(value);
  return status !== null && list.includes(status);
};

// Conjuntos equivalentes a domain/enums/reservation-request/request-status.js del back.
export const canApprove = is(["PENDING"]);
export const canReassign = is(["PENDING", "APPROVED", "ASSIGNED"]);
export const canConfirmResources = is(["ASSIGNED", "COORDINATION_INCOMPLETE"]);
export const canEditAgreements = is(["COORDINATION_READY", "COORDINATION_INCOMPLETE", "ADJUSTMENTS_REQUESTED"]);
export const isProposalVisible = is(["PROPOSAL_GENERATED", "IN_REVIEW", "ADJUSTMENTS_REQUESTED", "CONFIRMED", "FINALIZED"]);
export const isConfirmed = is(["CONFIRMED"]);

/** Pasos del flujo principal para timelines/steppers. */
export const FLOW_STEPS: { key: string; label: string; clientLabel: string; statuses: RequestStatus[] }[] = [
  { key: "received", label: "Pendiente", clientLabel: "Recibida", statuses: ["PENDING"] },
  { key: "approved", label: "Aprobada", clientLabel: "Aprobada", statuses: ["APPROVED"] },
  {
    key: "planning",
    label: "Coordinación",
    clientLabel: "Planeación",
    statuses: ["ASSIGNED", "COORDINATION_READY", "COORDINATION_INCOMPLETE"],
  },
  {
    key: "proposal",
    label: "Propuesta",
    clientLabel: "Propuesta",
    statuses: ["PROPOSAL_GENERATED", "IN_REVIEW", "ADJUSTMENTS_REQUESTED"],
  },
  { key: "confirmed", label: "Confirmado", clientLabel: "Confirmado", statuses: ["CONFIRMED"] },
  { key: "finalized", label: "Finalizado", clientLabel: "Finalizado", statuses: ["FINALIZED"] },
];

/** Índice del paso actual; -1 si el estado es terminal fuera del flujo (cancelado/rechazado). */
export function flowStepIndex(value: string | null | undefined): number {
  const status = normalizeStatus(value);
  if (!status) return -1;
  return FLOW_STEPS.findIndex((step) => step.statuses.includes(status));
}
