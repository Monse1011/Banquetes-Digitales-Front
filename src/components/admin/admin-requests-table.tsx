import type { AdminRequest } from "@/lib/api/admin";

type AdminRequestsTableProps = {
  requests: AdminRequest[];
  onApprove: (requestId: number) => void;
  onView: (requestId: number) => void;
};

export function AdminRequestsTable({
  requests,
  onApprove,
  onView,
}: AdminRequestsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Folio
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Cliente
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Fecha
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Servicios
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Estado
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Responsable de logística
            </th>
            <th className="px-4 py-3 font-medium text-[#5A3A3E]">
              Acción
            </th>
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
                {request.requested_date}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">
                {request.selected_services.join(", ")}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">
                {request.status}
              </td>

              <td className="px-4 py-4 text-[#5A3A3E]">
                {request.logistic_user ? (
                  <div className="min-w-48 space-y-1">
                    <p className="font-medium text-[#2C1A1D]">{request.logistic_user.full_name}</p>
                    <p className="text-xs">ID: {request.logistic_user.id}</p>
                    <p className="break-words text-xs">{request.logistic_user.email || "Correo sin registrar"}</p>
                  </div>
                ) : (
                  <span>{["Pendiente", "Aprobada"].includes(request.status) ? "Sin asignar" : "Responsable no informado"}</span>
                )}
              </td>

              <td className="px-4 py-4">
                <button type="button" onClick={() => onView(request.request_id)} className="mb-2 whitespace-nowrap rounded border border-[#E8D8DB] px-3 py-2 text-[#6B2737]">Ver ficha</button>
                {request.status === "Pendiente" && (
                  <button
                    type="button"
                    onClick={() => onApprove(request.request_id)}
                    className="rounded-md bg-[#6B2737] px-4 py-2 text-sm font-medium text-white"
                  >
                    Aprobar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}