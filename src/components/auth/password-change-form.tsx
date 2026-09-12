"use client";

import { FormEvent, useState } from "react";

import { changePassword } from "@/lib/api/auth";

type PasswordChangeFormProps = {
  token: string;
  currentPassword: string;
  onSuccess: () => void;
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  hasError,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={label}
        className="text-xs font-medium tracking-[0.08em] text-[#5A3A3E] uppercase"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={label}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-sm border bg-white px-4 py-3 pr-12 text-sm text-[#2C1A1D] outline-none transition-all placeholder:text-[#B8A0A4] focus:border-[#6B2737] focus:ring-2 focus:ring-[#6B2737]/10 ${
            hasError ? "border-[#C0392B]" : "border-[#D4BFC2]"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0707A] transition-colors hover:text-[#6B2737]"
          aria-label={
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          <EyeIcon open={showPassword} />
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeForm({
  token,
  currentPassword,
  onSuccess,
}: PasswordChangeFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(token, currentPassword, newPassword);

      setSuccess(true);
      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar la contraseña.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#F5EBE8] via-[#EEE0DE] to-[#E8D4D0] px-4 py-10">
      <section className="w-full max-w-md rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] px-10 py-10 shadow-[0_8px_40px_rgba(107,39,55,0.10)]">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex flex-col items-center gap-1">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="18"
                cy="18"
                r="17"
                stroke="#6B2737"
                strokeWidth="1.5"
              />
              <path
                d="M10 22 Q18 10 26 22"
                stroke="#6B2737"
                strokeWidth="1.4"
                fill="none"
              />
              <path
                d="M12 22 Q18 13 24 22"
                stroke="#A0404F"
                strokeWidth="0.8"
                fill="none"
              />
              <circle cx="18" cy="24" r="2" fill="#6B2737" />
              <line
                x1="18"
                y1="26"
                x2="18"
                y2="29"
                stroke="#6B2737"
                strokeWidth="1.2"
              />
              <line
                x1="14"
                y1="28"
                x2="22"
                y2="28"
                stroke="#6B2737"
                strokeWidth="1.2"
              />
            </svg>

            <span className="font-display text-xl tracking-wide text-[#2C1A1D]">
              Banquetes Elegancia
            </span>

            <div className="mt-1 h-px w-40 bg-[#6B2737]/40" />

            <span className="font-sans text-[10px] tracking-[0.2em] text-[#6B2737] uppercase">
              Gestión Interna
            </span>
          </div>

          <h1 className="mt-8 text-center font-display text-2xl font-semibold text-[#2C1A1D]">
            Establecer Contraseña
          </h1>

          <p className="mt-2 text-center text-xs leading-relaxed text-[#7A5055]">
            Es tu primer acceso al sistema. Por seguridad,
            <br />
            debes establecer una nueva contraseña.
          </p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <PasswordInput
            label="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            hasError={Boolean(error)}
          />

          <PasswordInput
            label="Confirmar contraseña"
            value={confirmation}
            onChange={setConfirmation}
            hasError={Boolean(error)}
          />

          <p className="text-[11px] leading-relaxed text-[#9A7075]">
            Mínimo 8 caracteres, incluyendo mayúscula, número y símbolo.
          </p>

          {error && (
            <p className="text-xs font-medium text-[#C0392B]">{error}</p>
          )}

          {success && (
            <p className="text-xs font-medium text-[#2D5A3D]">
              Contraseña establecida correctamente.
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full rounded-sm bg-[#6B2737] py-3 text-sm font-medium tracking-[0.06em] text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] transition-all hover:bg-[#4A1824] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#C0A0A5]"
          >
            {isLoading ? "Estableciendo..." : "Establecer contraseña"}
          </button>
        </form>

        <footer className="mt-6 border-t border-[#E8D8DB] pt-5">
          <p className="text-center text-[10px] tracking-wide text-[#B8A0A4]">
            © 2026 Banquetes Elegancia · Acceso restringido al personal
            autorizado
          </p>
        </footer>
      </section>
    </main>
  );
}