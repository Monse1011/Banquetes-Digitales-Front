"use client";

import { CalendarView } from "@/components/backstage/calendar-view";
import { PageHeader } from "@/components/ui/layout";
import { useAuth } from "@/lib/auth/auth-context";
import { can } from "@/lib/auth/permissions";

export default function CalendarPage() {
  const { user } = useAuth();
  const isAdmin = can(user?.role, "calendar.global");

  return (
    <>
      <PageHeader
        title="Calendario"
        description={isAdmin ? "Todos los eventos agendados (consulta)." : "Eventos a tu cargo."}
      />
      <CalendarView
        scope={isAdmin ? "admin" : "logistics"}
        detailHref={(event) => (isAdmin ? `/panel/solicitudes/${event.request_id}` : `/panel/mis-solicitudes/${event.request_id}`)}
      />
    </>
  );
}
