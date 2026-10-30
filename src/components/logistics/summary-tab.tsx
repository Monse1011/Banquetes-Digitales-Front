"use client";

import { Badge } from "@/components/ui/feedback";
import { Card, CardHeader, DetailList } from "@/components/ui/layout";
import type { AssignedRequestDetail } from "@/lib/api/logistics";
import { formatDateTime, formatLongDate, formatTime } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = { human: "Personal", material: "Material", logistic: "Logística" };

export function ClientAdjustments({ detail }: { detail: AssignedRequestDetail }) {
  if (!detail.adjustments?.length) return null;
  return (
    <Card className="border-amber-200">
      <CardHeader title="Ajustes solicitados por el cliente" description="Considéralos al registrar los nuevos acuerdos." />
      <ul className="divide-y divide-line">
        {detail.adjustments.map((adjustment) => (
          <li key={adjustment.id} className="space-y-1 px-5 py-4 text-sm">
            <p className="text-xs text-muted">
              {adjustment.proposals_code ? `${adjustment.proposals_code} · v${adjustment.version} · ` : ""}
              {formatDateTime(adjustment.requested_at)}
            </p>
            <p>“{adjustment.observations}”</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function SummaryTab({ detail }: { detail: AssignedRequestDetail }) {
  return (
    <div className="space-y-6">
      <ClientAdjustments detail={detail} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Evento"
            description={
              <Badge tone={detail.schedule_type === "confirmado" ? "ok" : "info"}>
                Horario {detail.schedule_type === "confirmado" ? "confirmado" : "propuesto"}
              </Badge>
            }
          />
          <div className="p-5">
            <DetailList
              items={[
                { label: "Fecha", value: <span className="first-letter:uppercase">{formatLongDate(detail.event_date)}</span> },
                { label: "Horario", value: `${formatTime(detail.start_time)} – ${formatTime(detail.end_time)} h` },
                { label: "Lugar", value: detail.event_address },
                { label: "Invitados", value: detail.guest_count },
                {
                  label: "Propuesta vista por el cliente",
                  value: detail.proposal_viewed_at ? formatDateTime(detail.proposal_viewed_at) : "Aún no",
                },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Cliente" />
          <div className="p-5">
            <DetailList
              items={[
                { label: "Nombre", value: detail.client.client_name },
                {
                  label: "Correo",
                  value: (
                    <a className="text-wine hover:underline" href={`mailto:${detail.client.client_email}`}>
                      {detail.client.client_email}
                    </a>
                  ),
                },
                {
                  label: "Teléfono",
                  value: (
                    <a className="text-wine hover:underline" href={`tel:${detail.client.client_phone}`}>
                      {detail.client.client_phone}
                    </a>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Servicios solicitados" description="Recursos que requiere cada servicio." />
        <ul className="divide-y divide-line">
          {detail.selected_services.map((service) => (
            <li key={service.service_id} className="px-5 py-4 text-sm">
              <p className="font-medium">{service.service_name}</p>
              {service.required_resources.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {service.required_resources.map((resource, index) => (
                    <li key={index} className="rounded-full bg-cream px-3 py-1 text-xs">
                      {TYPE_LABEL[resource.type] ?? resource.type}: {resource.resource_or_operative_role} × {resource.quantity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-muted">Sin recursos predefinidos; define los necesarios al confirmar recursos.</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
