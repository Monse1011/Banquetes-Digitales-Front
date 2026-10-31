"use client";

import { useState } from "react";
import { CalendarView } from "@/components/backstage/calendar-view";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/layout";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { isSynced, type CalendarEvent } from "@/lib/api/calendar";
import { errorMessage } from "@/lib/api/http";
import { cancelEvent, editEvent, retrySync } from "@/lib/api/logistics";
import { useAuth } from "@/lib/auth/auth-context";
import { can } from "@/lib/auth/permissions";
import { todayInMerida, toInputParts, toSqlDateTime } from "@/lib/format";
import { normalizeStatus } from "@/lib/status";

export default function CalendarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = can(user?.role, "calendar.global");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [cancelling, setCancelling] = useState<CalendarEvent | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const reload = () => setRefresh((r) => r + 1);

  const sync = async (event: CalendarEvent) => {
    setSyncing(event.event_id);
    try {
      toast.success((await retrySync(event.event_id)) ?? "Sincronización solicitada.");
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSyncing(null);
    }
  };

  // Logística opera sus eventos; el admin solo consulta.
  const actions = (event: CalendarEvent) => {
    const editable = normalizeStatus(event.status) === "CONFIRMED" && event.start_datetime.slice(0, 10) >= todayInMerida();
    return (
      <div className="flex flex-wrap gap-1">
        {!isSynced(event.sync_status) && normalizeStatus(event.status) !== "CANCELED" ? (
          <Button size="sm" variant="ghost" icon="refresh" loading={syncing === event.event_id} onClick={() => sync(event)}>
            Sincronizar
          </Button>
        ) : null}
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
  const start = toInputParts(event.start_datetime);
  const end = toInputParts(event.end_datetime);
  const [values, setValues] = useState({
    location: event.location,
    start_date: start.date,
    start_time: start.time,
    end_date: end.date,
    end_time: end.time,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.location.trim()) return setError("La ubicación es obligatoria.");
    if (`${values.end_date}T${values.end_time}` <= `${values.start_date}T${values.start_time}`) {
      return setError("El término debe ser posterior al inicio.");
    }
    setBusy(true);
    setError("");
    try {
      await editEvent(event.event_id, {
        location: values.location.trim(),
        start_datetime: toSqlDateTime(values.start_date, values.start_time),
        end_datetime: toSqlDateTime(values.end_date, values.end_time),
      });
      onSaved();
    } catch (err) {
      setBusy(false);
      setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Editar evento ${event.folio}`}
      description="El responsable y los recursos no se modifican desde aquí."
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
        <TextField label="Ubicación" value={values.location} onChange={(e) => set({ location: e.target.value })} required />
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <TextField label="Inicio" type="date" value={values.start_date} onChange={(e) => set({ start_date: e.target.value })} required />
          <TextField label="Hora" type="time" value={values.start_time} onChange={(e) => set({ start_time: e.target.value })} required />
        </div>
        <div className="grid grid-cols-[3fr_2fr] gap-2">
          <TextField label="Término" type="date" value={values.end_date} onChange={(e) => set({ end_date: e.target.value })} required />
          <TextField label="Hora" type="time" value={values.end_time} onChange={(e) => set({ end_time: e.target.value })} required />
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </form>
    </Modal>
  );
}
