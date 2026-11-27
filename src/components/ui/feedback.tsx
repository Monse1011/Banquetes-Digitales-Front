import type { ReactNode } from "react";
import { Icon } from "./icon";
import { statusLabel, statusTone, type Tone } from "@/lib/status";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-cream-dark text-muted",
  info: "bg-sky-100 text-sky-800",
  ok: "bg-emerald-100 text-emerald-800",
  warn: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  accent: "bg-wine/10 text-wine",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  return <Badge tone={statusTone(status)}>{label ?? statusLabel(status)}</Badge>;
}

const ALERT_STYLES = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "info" },
  ok: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "check" },
  warn: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "alert" },
  danger: { box: "border-red-200 bg-red-50 text-red-900", icon: "alert" },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof ALERT_STYLES;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const style = ALERT_STYLES[tone];
  return (
    <div className={`flex gap-3 rounded-lg border p-4 text-sm ${style.box}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={style.icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-muted">
      <Icon name={icon} className="h-10 w-10 text-gold" />
      <p className="font-medium text-ink">{title}</p>
      {children ? <div className="max-w-md text-sm">{children}</div> : null}
    </div>
  );
}
