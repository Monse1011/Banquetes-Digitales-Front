import { apiRequest } from "./http";
export type Proposal = {
  proposal_id: number;
  proposals_code: string;
  name: string;
  creation_date: string;
  status: string;
  request_status?: string;
  pdf_url?: string;
};
export async function generateProposal(id: number, agreementId: number) {
  const result = await apiRequest<{ data: Proposal }>(
    `/api/logistics/requests/${id}/proposals`,
    {
      method: "POST",
      body: { data: { derived_information_id: agreementId } },
    },
  );
  return result.data;
}
export async function getProposal(id: number, signal?: AbortSignal) {
  const result = await apiRequest<{ data: Proposal }>(
    `/api/logistics/requests/${id}/proposals`,
    { signal },
  );
  return result.data;
}
export function downloadProposal(id: number) {
  return apiRequest<Blob>(`/api/logistics/requests/${id}/proposals/download`, {
    responseType: "blob",
  });
}

export function sendProposal(id: number) {
  return apiRequest<void>(`/api/logistics/requests/${id}/proposals/send`, {
    method: "POST",
    responseType: "empty",
    fallback: "No fue posible enviar la propuesta.",
  });
}
