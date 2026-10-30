"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isNewPasswordValid, NewPasswordFields } from "@/components/auth/password-fields";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { resetPassword } from "@/lib/api/auth";
import { DocumentTitle } from "@/components/ui/layout";
import { errorMessage } from "@/lib/api/http";

// Destino del enlace enviado por correo: RESET_PASSWORD_URL?token=... (configurado en el back).
export default function ResetPasswordPage() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!isNewPasswordValid(password, confirm)) return;
    setBusy(true);
    try {
      setDone(await resetPassword(token, password));
    } catch (err) {
      setError(errorMessage(err, "No fue posible restablecer la contraseña."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <DocumentTitle title="Restablecer contraseña" />
      <div>
        <h1 className="font-display text-3xl font-semibold">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-muted">Define una nueva contraseña para tu cuenta.</p>
      </div>
      {!token ? (
        <Alert tone="danger" title="Enlace inválido">
          El enlace no contiene un token. Solicita uno nuevo desde{" "}
          <Link href="/recuperar" className="underline">
            recuperar contraseña
          </Link>
          .
        </Alert>
      ) : done ? (
        <div className="space-y-4">
          <Alert tone="ok">{done}</Alert>
          <ButtonLink href="/acceso" className="w-full" size="lg">
            Iniciar sesión
          </ButtonLink>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <NewPasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            showErrors={submitted}
          />
          {error ? (
            <Alert tone="danger">
              {error}{" "}
              <Link href="/recuperar" className="underline">
                Solicitar un enlace nuevo
              </Link>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            Guardar contraseña
          </Button>
        </form>
      )}
    </div>
  );
}
