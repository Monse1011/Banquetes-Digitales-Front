import type { AssignmentRequest } from "./assignment-types";
import { AssignmentsTable } from "./assignments-table";

type AssignmentsContentProps = {
  requests: AssignmentRequest[];
  onAssign: (request: AssignmentRequest) => void;
};

export function AssignmentsContent({
  requests,
  onAssign,
}: AssignmentsContentProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-6 py-10 text-center">
        <p className="text-sm text-[#7A5055]">
          No existen solicitudes aprobadas pendientes de asignar.
        </p>
      </div>
    );
  }

  return <AssignmentsTable requests={requests} onAssign={onAssign} />;
}