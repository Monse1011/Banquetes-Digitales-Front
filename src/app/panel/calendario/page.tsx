"use client";

import { useState } from "react";
import { CalendarView } from "@/components/backstage/calendar-view";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { CalendarEvent } from "@/lib/api/calendar";
import { ApiError, errorMessage } from "@/lib/api/http";
import { cancelEvent, editEvent } from "@/lib/api/logistics";
import { useAuth } from "@/lib/auth/auth-context";
import { can } from "@/lib/auth/permissions";
import { formatDateTime, todayInMerida } from "@/lib/format";
import { normalizeStatus } from "@/lib/status";

export default function CalendarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = can(user?.role, "calendar.global");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [cancelling, setCancelling] = useState<CalendarEvent | null>(null);
  const reload = () => setRefresh((r) => r + 1);

  // Logística opera sus eventos; el admin solo consulta.
  const actions = (event: CalendarEvent) => {
    const editable = normalizeStatus(event.status) === "CONFIRMED" && event.start_datetime.slice(0, 10) >= todayInMerida();
    return (
      <div className="flex flex-wrap gap-1">
        {editable ? (
          <>
            <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(event)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setCancelling(event)}>
              Cancelar
            </Button>
          </>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Calendario" description={isAdmin ? "Todos los eventos agendados (consulta)." : "Eventos a tu cargo."} />
      <CalendarView
        scope={isAdmin ? "admin" : "logistics"}
        refreshKey={refresh}
        detailHref={(event) => (isAdmin ? `/panel/solicitudes/${event.request_id}` : `/panel/mis-solicitudes/${event.request_id}`)}
        renderActions={isAdmin ? undefined : actions}
      />
      {editing ? (
        <EditEventModal
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success("Evento actualizado.");
            reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancelar evento"
        confirmLabel="Cancelar evento"
        tone="danger"
        onConfirm={async () => {
          if (!cancelling) return;
          await cancelEvent(cancelling.event_id);
          toast.success(`Evento ${cancelling.folio} cancelado.`);
          reload();
        }}
      >
        <p>
          El evento <strong>{cancelling?.folio}</strong> se cancelará y sus recursos se liberarán de inmediato. Esta acción no se
          puede deshacer.
        </p>
      </ConfirmDialog>
    </>
  );
}

function EditEventModal({ event, onClose, onSaved }: { event: CalendarEvent; onClose: () => void; onSaved: () => void }) {
  const [location, setLocation] = useState(event.location);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return setError("La ubicación es obligatoria.");
    setBusy(true);
    setError("");
    try {
      await editEvent(event.event_id, { location: location.trim() });
      onSaved();
    } catch (err) {
      setBusy(false);
      // 422: el mensaje específico viene en errors.<campo>.
      setError((err instanceof ApiError && Object.values(err.fieldErrors)[0]) || errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Editar evento ${event.folio}`}
      description="En un evento confirmado solo se puede modificar la ubicación."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="event-form" loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <TextField
          label="Fecha y hora"
          value={`${formatDateTime(event.start_datetime)} – ${formatDateTime(event.end_datetime)}`}
          hint="No es posible cambiar la fecha ni la hora de un evento confirmado."
          disabled
          readOnly
        />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}
