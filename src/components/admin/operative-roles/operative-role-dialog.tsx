"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function OperativeRoleDialog({ title, busy, onClose, children }: {
  title: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="operative-role-dialog-title"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] text-[#5A3A3E] shadow-xl backdrop:bg-black/30"
    >
      <header className="flex items-center justify-between border-b border-[#E8D8DB] p-6">
        <h2 id="operative-role-dialog-title" className="font-display text-2xl font-semibold text-[#2C1A1D]">{title}</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Cerrar" className="text-lg text-[#7A5055] disabled:opacity-50">×</button>
      </header>
      {children}
    </dialog>
  );
}
