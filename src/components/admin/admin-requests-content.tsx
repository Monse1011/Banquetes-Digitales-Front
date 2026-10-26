import type { AdminRequest } from "@/lib/api/admin";
import { AdminRequestsTable } from "./admin-requests-table";

type AdminRequestsContentProps = {
  isLoading: boolean;
  error: string;
  requests: AdminRequest[];
  onApprove: (requestId: number) => void;
  approvingIds: number[];
  approvalErrors: Record<number, string>;
  onRetry: () => void;
};

export function AdminRequestsContent({
  isLoading,
  error,
  requests,
  onApprove,
  approvingIds,
  approvalErrors,
  onRetry,
}: AdminRequestsContentProps) {
  if (isLoading) {
    return <p className="text-sm text-[#7A5055]">Cargando solicitudes...</p>;
  }

  if (error) {
    return (
      <div className="rounded-sm border border-[#E6B8B8] bg-[#FFF4F2] px-4 py-3">
        <p role="alert" className="text-sm text-[#C0392B]">{error}</p>
        <button type="button" onClick={onRetry} className="mt-2 text-sm underline">
          Reintentar carga
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-[#7A5055]">No hay solicitudes registradas.</p>
    );
  }

  return (
    <AdminRequestsTable
      requests={requests}
      onApprove={onApprove}
      approvingIds={approvingIds}
      approvalErrors={approvalErrors}
    />
  );
}
