import type { AssignmentRequest } from "./assignment-types";

type AssignmentsTableProps = {
  requests: AssignmentRequest[];
  onAssign: (request: AssignmentRequest) => void;
};

function formatEventDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(parsedDate);
}

export function AssignmentsTable({
  requests,
  onAssign,
}: AssignmentsTableProps) {
  return (
    <div className="overflow-x-auto rounded border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#E8D8DB]">
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Folio
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Cliente
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Fecha
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Hora inicio
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Hora fin
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Ubicación
            </th>
            <th className="pb-3 text-xs font-semibold uppercase text-[#7A5055]">
              Invitados
            </th>
            <th className="pb-3 text-right text-xs font-semibold uppercase text-[#7A5055]">
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
              <td className="py-4 pr-4 text-sm font-medium text-[#6B2737]">
                {request.folio}
              </td>

              <td className="py-4 pr-4 text-sm text-[#2C1A1D]">
                {request.client_name}
              </td>

              <td className="py-4 pr-4 text-sm text-[#5A3A3E]">
                {formatEventDate(request.event_date)}
              </td>

              <td className="py-4 pr-4 text-sm text-[#5A3A3E]">
                {request.start_time}
              </td>

              <td className="py-4 pr-4 text-sm text-[#5A3A3E]">
                {request.end_time}
              </td>

              <td className="py-4 pr-4 text-sm text-[#5A3A3E]">
                {request.event_address}
              </td>

              <td className="py-4 pr-4 text-sm text-[#5A3A3E]">
                {request.guest_count}
              </td>

              <td className="py-4 text-right">
                <button
                  type="button"
                  onClick={() => onAssign(request)}
                  className="rounded border border-[#E8D8DB] px-3 py-1.5 text-xs font-medium text-[#6B2737] transition-colors hover:bg-[#F5EBE8]"
                >
                  Asignar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}