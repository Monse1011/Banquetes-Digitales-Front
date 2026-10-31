import { Icon } from "@/components/ui/icon";
import { FLOW_STEPS, flowStepIndex, normalizeStatus } from "@/lib/status";

/** Avance del flujo de la solicitud. Cancelada/rechazada se muestran como estado terminal. */
export function StatusTimeline({ status, clientFacing = true }: { status: string; clientFacing?: boolean }) {
  const normalized = normalizeStatus(status);
  const current = flowStepIndex(status);

  if (normalized === "CANCELED" || normalized === "REJECTED") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-900">
        <Icon name="ban" />
        {normalized === "CANCELED"
          ? "Esta solicitud fue cancelada."
          : "La propuesta fue rechazada. Si cambias de opinión, contáctanos para iniciar una nueva solicitud."}
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-3 gap-y-6 sm:grid-cols-6">
      {FLOW_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="relative flex flex-col items-center text-center">
            {index > 0 ? (
              <span
                className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${index <= current ? "bg-wine" : "bg-line"}`}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                done
                  ? "border-wine bg-wine text-white"
                  : active
                    ? "border-wine bg-white text-wine ring-4 ring-wine/15"
                    : "border-line bg-white text-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Icon name="check" className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`mt-2 text-xs ${active ? "font-semibold text-wine" : done ? "text-ink" : "text-muted"}`}>
              {clientFacing ? step.clientLabel : step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
