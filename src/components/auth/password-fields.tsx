import { TextField } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { PASSWORD_RULES, validatePassword } from "@/lib/validation";

/** Nueva contraseña + confirmación con la política del back visible. */
export function NewPasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  showErrors,
}: {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  showErrors: boolean;
}) {
  const policyError = showErrors ? validatePassword(password) : undefined;
  const confirmError = showErrors && password !== confirm ? "Las contraseñas no coinciden" : undefined;
  return (
    <>
      <TextField
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        error={policyError}
        required
      />
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className={`flex items-center gap-1 ${ok ? "text-ok" : "text-muted"}`}>
              <Icon name={ok ? "check" : "close"} className="h-3.5 w-3.5" />
              {rule.label}
            </li>
          );
        })}
      </ul>
      <TextField
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => onConfirmChange(event.target.value)}
        error={confirmError}
        required
      />
    </>
  );
}

export function isNewPasswordValid(password: string, confirm: string) {
  return !validatePassword(password) && password === confirm;
}
