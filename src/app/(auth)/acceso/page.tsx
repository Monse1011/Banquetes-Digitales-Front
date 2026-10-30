"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { getSession, login } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/auth-context";

/** Solo se permite redirigir a rutas internas del panel. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/panel") ? value : "/panel";
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, firstAccess, loading, expired, setSession } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(firstAccess ? "/panel/cambiar-contrasena" : next);
  }, [loading, user, firstAccess, next, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLocked(false);
    if (!employeeId.trim() || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setBusy(true);
    try {
      const loggedUser = await login(employeeId.trim(), password);
      // El login no informa el primer acceso; se consulta la sesión recién creada.
      const session = await getSession().catch(() => null);
      setSession(session?.user ?? loggedUser, session?.firstAccess ?? false);
    } catch (err) {
      setLocked(err instanceof ApiError && err.status === 423);
      setError(errorMessage(err, "No fue posible iniciar sesión."));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted">Acceso exclusivo para el personal de Banquetes Elegancia.</p>
      </div>
      {expired || params.get("expired") ? (
        <Alert tone="warn">Tu sesión expiró. Inicia sesión nuevamente.</Alert>
      ) : null}
      <form className="space-y-4" onSubmit={submit} noValidate>
        <TextField
          label="Número de empleado"
          placeholder="Ej. 001"
          inputMode="numeric"
          autoComplete="username"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? (
          <Alert tone="danger" title={locked ? "Cuenta bloqueada" : undefined}>
            {error}
            {locked ? " Espera unos minutos o restablece tu contraseña." : null}
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          Entrar
        </Button>
      </form>
      <p className="text-center text-sm">
        <Link href="/recuperar" className="text-wine hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </div>
  );
}
