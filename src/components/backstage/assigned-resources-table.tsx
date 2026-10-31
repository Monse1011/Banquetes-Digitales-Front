import { Badge } from "@/components/ui/feedback";
import type { AssignedResource } from "@/lib/api/admin-requests";

const GROUPS = [
  { key: "human", title: "Personal" },
  { key: "material", title: "Material" },
  { key: "logistic", title: "Logística" },
] as const;

/** Recursos asignados a una solicitud, en solo lectura (contrato §4.1.2). */
export function AssignedResourcesView({
  assignments,
}: {
  assignments: { human: AssignedResource[]; material: AssignedResource[]; logistic: AssignedResource[] };
}) {
  const total = GROUPS.reduce((sum, group) => sum + (assignments[group.key]?.length ?? 0), 0);
  if (total === 0) return <p className="px-5 py-6 text-sm text-muted">Aún no hay recursos asignados.</p>;

  return (
    <div className="divide-y divide-line">
      {GROUPS.filter((group) => assignments[group.key]?.length).map((group) => (
        <div key={group.key} className="overflow-x-auto">
          <p className="bg-cream/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</p>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Recurso</th>
                <th className="px-5 py-2 text-right font-medium">Solicitado</th>
                <th className="px-5 py-2 text-right font-medium">Asignado</th>
                <th className="hidden px-5 py-2 text-right font-medium sm:table-cell">Disponible</th>
                <th className="px-5 py-2 font-medium">Suficiencia</th>
                <th className="hidden px-5 py-2 font-medium md:table-cell">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {assignments[group.key].map((resource) => (
                <tr key={resource.id}>
                  <td className="px-5 py-2.5">
                    <p>{resource.name}</p>
                    {resource.operative_role ? <p className="text-xs text-muted">{resource.operative_role}</p> : null}
                    {resource.assignment.observation ? (
                      <p className="text-xs italic text-muted">“{resource.assignment.observation}”</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-2.5 text-right">{resource.assignment.requested_quantity}</td>
                  <td className="px-5 py-2.5 text-right">{resource.assignment.assigned_quantity}</td>
                  <td className="hidden px-5 py-2.5 text-right sm:table-cell">{resource.assignment.available_quantity}</td>
                  <td className="px-5 py-2.5">
                    <Badge tone={resource.assignment.sufficiency === "Suficiente" ? "ok" : "warn"}>{resource.assignment.sufficiency}</Badge>
                  </td>
                  <td className="hidden px-5 py-2.5 md:table-cell">
                    <Badge tone={resource.assignment.status === "Confirmada" ? "ok" : "neutral"}>{resource.assignment.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
