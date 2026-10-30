"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Alert, LoadingBlock } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth/auth-context";
import { can, navFor, ROLE_LABELS, type Permission } from "@/lib/auth/permissions";

const CHANGE_PASSWORD = "/panel/cambiar-contrasena";

function isActive(pathname: string, href: string) {
  return href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Protege todo /panel: requiere sesión y fuerza el cambio de contraseña en el primer acceso. */
export function BackstageShell({ children }: { children: ReactNode }) {
  const { user, firstAccess, loading, error, expired, refresh, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (loading || error) return;
    if (!user) {
      const params = new URLSearchParams({ next: pathname });
      if (expired) params.set("expired", "1");
      router.replace(`/acceso?${params.toString()}`);
    } else if (firstAccess && pathname !== CHANGE_PASSWORD) {
      router.replace(CHANGE_PASSWORD);
    }
  }, [loading, error, user, firstAccess, expired, pathname, router]);

  if (error && !user) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Alert tone="danger" title="No fue posible verificar tu sesión" action={<Button onClick={refresh}>Reintentar</Button>}>
          {error}
        </Alert>
      </div>
    );
  }

  if (loading || !user || (firstAccess && pathname !== CHANGE_PASSWORD)) {
    return <LoadingBlock label="Verificando sesión…" />;
  }

  const nav = firstAccess ? [] : navFor(user.role);

  const signOut = async () => {
    await logout();
    router.replace("/acceso");
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Navegación del panel">
      <div className="mb-6 px-2">
        <Logo href="/panel" light />
      </div>
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link
          href={CHANGE_PASSWORD}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <Icon name="key" /> Cambiar contraseña
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <Icon name="logout" /> Cerrar sesión
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-ink lg:block">{sidebar}</aside>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink/50" />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-cream/90 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-cream-dark lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Icon name="menu" />
          </button>
          <div className="ml-auto flex items-center gap-3 text-right">
            <div className="leading-tight">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted">
                {ROLE_LABELS[user.role]} · {user.employeeId}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wine text-sm font-semibold text-white">
              {user.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function Forbidden({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <Icon name="ban" className="h-12 w-12 text-danger" />
      <h1 className="font-display text-2xl font-semibold">Sin permisos</h1>
      <p className="text-sm text-muted">{message ?? "Tu rol no tiene acceso a esta sección."}</p>
      <Link href="/panel" className="text-sm text-wine hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}

/** Muestra `children` solo si el rol del usuario tiene el permiso indicado. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { user } = useAuth();
  if (!can(user?.role, permission)) return <Forbidden />;
  return <>{children}</>;
}
