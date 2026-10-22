import Link from "next/link";
import type { AdminRequest } from "@/lib/api/admin";

type AdminRequestsTableProps = {
  requests: AdminRequest[];
  onApprove: (requestId: number) => void;
  approvingIds: number[];
  approvalErrors: Record<number, string>;
};

function formatRequestedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Merida",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminRequestsTable({
  requests,
  onApprove,
  approvingIds,
  approvalErrors,
}: AdminRequestsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">Folio</th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">Cliente</th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Fecha de solicitud
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">Servicios</th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">Estado</th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">Acción</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((request) => (
            <tr
              key={request.request_id}
              className="border-b border-[#E8D8DB] last:border-b-0"
            >
              <td className="px-4 py-4 font-medium text-[#6B2737]">
                {request.folio}
              </td>

              <td className="px-4 py-4 text-[#2C1A1D]">
                {request.client_name}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">
                {formatRequestedDate(request.requested_date)}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">
                {request.selected_services.length
                  ? request.selected_services.join(", ")
                  : "Sin servicios registrados"}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">{request.status}</td>

              <td className="px-4 py-4">
                {["Asignada", "Coordinación Incompleta"].includes(
                  request.status,
                ) && (
                  <Link
                    className="mr-3 inline-block text-[#6B2737] underline"
                    href={`/logistics/recursos/${request.request_id}`}
                  >
                    Confirmar recursos
                  </Link>
                )}
                {["Coordinación Lista", "Coordinación Incompleta"].includes(
                  request.status,
                ) && (
                  <Link
                    className="text-[#6B2737] underline"
                    href={`/logistics/acuerdos/${request.request_id}`}
                  >
                    Registrar acuerdos
                  </Link>
                )}
                {["Propuesta generada", "Confirmado", "Finalizado"].includes(
                  request.status,
                ) && (
                  <Link
                    className="text-[#6B2737] underline"
                    href={`/logistics/propuesta/${request.request_id}`}
                  >
                    Ver propuesta
                  </Link>
                )}
                {request.status === "Pendiente" && (
                  <button
                    type="button"
                    onClick={() => onApprove(request.request_id)}
                    disabled={approvingIds.includes(request.request_id)}
                    aria-busy={approvingIds.includes(request.request_id)}
                    className="rounded-md bg-[#6B2737] px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {approvingIds.includes(request.request_id)
                      ? "Aprobando…"
                      : "Aprobar"}
                  </button>
                )}
                {approvalErrors[request.request_id] && (
                  <p
                    role="alert"
                    className="mt-2 max-w-xs text-sm text-[#C0392B]"
                  >
                    {approvalErrors[request.request_id]}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
