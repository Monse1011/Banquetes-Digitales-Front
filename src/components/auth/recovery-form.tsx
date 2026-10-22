"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword, resetPassword } from "@/lib/api/auth";
export function RecoveryForm({ token }: { token?: string }) {
  const resetting = token !== undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (resetting && (!token || password !== confirmation)) {
      setError(
        !token
          ? "El enlace no es válido o ha expirado."
          : "Las contraseñas no coinciden.",
      );
      return;
    }
    setBusy(true);
    try {
      if (resetting) await resetPassword(token!, password);
      else await forgotPassword(email);
      setPassword("");
      setConfirmation("");
      setDone(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field = "mt-2 w-full rounded border border-[#D4BFC2] bg-white p-3";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5EBE8] p-6">
      <section className="w-full max-w-md space-y-6 rounded border border-[#E8D8DB] bg-[#FDFAF8] p-8 text-[#5A3A3E]">
        <h1 className="font-display text-2xl">
          {resetting ? "Restablecer contraseña" : "Recuperar contraseña"}
        </h1>
        {done ? (
          <p role="status">
            {resetting
              ? "Contraseña actualizada. Ya puedes iniciar sesión."
              : "Si el correo está registrado, recibirá instrucciones para restablecer su contraseña."}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {resetting ? (
              <>
                <label className="block">
                  Nueva contraseña
                  <input
                    required
                    autoComplete="new-password"
                    type="password"
                    className={field}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="block">
                  Confirmar contraseña
                  <input
                    required
                    autoComplete="new-password"
                    type="password"
                    className={field}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="block">
                Correo electrónico
                <input
                  required
                  autoComplete="email"
                  type="email"
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            <button
              disabled={busy || (resetting && !token)}
              className="w-full rounded bg-[#6B2737] p-3 text-white disabled:opacity-50"
            >
              {busy
                ? "Enviando…"
                : resetting
                  ? "Guardar contraseña"
                  : "Enviar instrucciones"}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-sm underline">
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
