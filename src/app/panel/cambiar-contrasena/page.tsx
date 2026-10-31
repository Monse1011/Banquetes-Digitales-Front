"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isNewPasswordValid, NewPasswordFields } from "@/components/auth/password-fields";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/form";
import { Card, PageHeader } from "@/components/ui/layout";
import { useToast } from "@/components/ui/toast";
import { changePassword } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/http";
import { useAuth } from "@/lib/auth/auth-context";

export default function ChangePasswordPage() {
  const { firstAccess, setSession } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (!current || !isNewPasswordValid(password, confirm)) return;
    if (current === password) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }
    setBusy(true);
    try {
      const user = await changePassword(current, password);
      setSession(user, false);
      toast.success("Contraseña actualizada.");
      router.replace("/panel");
    } catch (err) {
      setError(errorMessage(err, "No fue posible cambiar la contraseña."));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title={firstAccess ? "Define tu contraseña" : "Cambiar contraseña"}
        description={
          firstAccess
            ? "Es tu primer acceso. Por seguridad, reemplaza la contraseña temporal que recibiste por correo."
            : "Actualiza la contraseña de tu cuenta."
        }
      />
      <Card className="p-6">
        <form className="space-y-4" onSubmit={submit} noValidate>
          <TextField
            label={firstAccess ? "Contraseña temporal" : "Contraseña actual"}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            error={submitted && !current ? "Campo obligatorio" : undefined}
            required
          />
          <NewPasswordFields
            password={password}
            confirm={confirm}
            onPasswordChange={setPassword}
            onConfirmChange={setConfirm}
            showErrors={submitted}
          />
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button type="submit" className="w-full" loading={busy}>
            Guardar contraseña
          </Button>
        </form>
      </Card>
    </div>
  );
}
