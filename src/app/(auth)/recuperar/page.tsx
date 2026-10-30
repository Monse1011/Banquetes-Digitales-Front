"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { forgotPassword } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/http";
import { EMAIL_REGEX } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setBusy(true);
    try {
      setSent(await forgotPassword(email.trim()));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-muted">Te enviaremos un enlace para restablecerla.</p>
      </div>
      {sent ? (
        <Alert tone="ok" title="Revisa tu correo">
          {sent}
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
            required
          />
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            Enviar instrucciones
          </Button>
        </form>
      )}
      <p className="text-center text-sm">
        <Link href="/acceso" className="text-wine hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
