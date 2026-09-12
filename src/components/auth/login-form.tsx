"use client";

import { FormEvent, useState } from "react";
import { login, type LoginResponse } from "@/lib/api/auth";
import { PasswordChangeForm } from "./password-change-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";


type LoginStatus = "idle" | "error" | "locked";

function EleganciaLogo() {
  return (
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
  );
}

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
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-sm border bg-white px-4 py-3 pr-12 text-sm text-[#2C1A1D] outline-none transition-all placeholder:text-[#B8A0A4] focus:border-[#6B2737] focus:ring-2 focus:ring-[#6B2737]/10 ${
          hasError ? "border-[#C0392B]" : "border-[#D4BFC2]"
        }`}
        aria-label="Contraseña"
      />

      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0707A] transition-colors hover:text-[#6B2737]"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <EyeIcon open={showPassword} />
      </button>
    </div>
  );
}

export function LoginForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [firstAccess, setFirstAccess] = useState<LoginResponse | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setSession } = useAuth(); 

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (isLoading){
    return;
  }

  setStatus("idle");
  setIsLoading(true);

  try {
    setCurrentPassword(password);
    const response = await login({
      employeeId,
      password,
    });

    if (response.requiresPasswordChange) {
      setFirstAccess(response);
      return;
    }

    setSession(response);
    router.push("/admin");  

  } catch (error) {
    const statusCode = (error as Error & { status?: number }).status;

    if (statusCode === 423) {
      setStatus("locked");
      return;
    }

    setStatus("error");
  } finally {
    setIsLoading(false);
  }

}

  const hasError = status === "error" || status === "locked";

  if (firstAccess) {
    return (
      <PasswordChangeForm
        token={firstAccess.token}
        currentPassword={currentPassword}
        onSuccess={() => {
          setCurrentPassword("");
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#F5EBE8] via-[#EEE0DE] to-[#E8D4D0] px-4 py-10">
      <section className="w-full max-w-md rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] px-10 py-10 shadow-[0_8px_40px_rgba(107,39,55,0.10)]">
        <header className="mb-8 flex flex-col items-center">
          <EleganciaLogo />

          <h1 className="mt-8 text-center font-display text-2xl font-semibold text-[#2C1A1D]">
            Iniciar Sesión
          </h1>
        </header>

        {status === "locked" && (
          <div className="mb-5 flex items-start gap-3 rounded-sm border border-[#E67E22] bg-[#FFF3E0] px-4 py-3">
            <svg
              className="mt-0.5 shrink-0 text-[#E67E22]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>

            <p className="text-xs leading-relaxed text-[#7D4800]">
              <strong className="font-semibold">Cuenta bloqueada.</strong>{" "}
              Demasiados intentos fallidos. Intente nuevamente en{" "}
              <strong className="font-semibold">15 minutos</strong>.
            </p>
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="employeeId"
              className="text-xs font-medium tracking-[0.08em] text-[#5A3A3E] uppercase"
            >
              ID de empleado
            </label>

            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="Ej. EMP-0042"
              className={`w-full rounded-sm border bg-white px-4 py-3 text-sm text-[#2C1A1D] outline-none transition-all placeholder:text-[#B8A0A4] focus:border-[#6B2737] focus:ring-2 focus:ring-[#6B2737]/10 ${
                hasError ? "border-[#C0392B]" : "border-[#D4BFC2]"
              }`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-[0.08em] text-[#5A3A3E] uppercase"
            >
              Contraseña
            </label>

            <PasswordInput
              value={password}
              onChange={setPassword}
              hasError={hasError}
            />

            {status === "error" && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="shrink-0 text-[#C0392B]"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>

                <span className="text-xs font-medium text-[#C0392B]">
                  Credenciales incorrectas. Verifique su ID y contraseña.
                </span>
              </div>
            )}
          </div>

          <div className="-mt-2 flex justify-end">
            <button
              type="button"
              className="text-xs text-[#6B2737] underline decoration-[#6B2737]/30 underline-offset-2 transition-colors hover:text-[#4A1824]"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={status === "locked" || isLoading}
            className={`w-full rounded-sm py-3 text-sm font-medium tracking-[0.06em] transition-all ${
              status === "locked"
                ? "cursor-not-allowed bg-[#C0A0A5] text-white"
                : "bg-[#6B2737] text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] hover:bg-[#4A1824] active:scale-[0.99]"
            }`}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
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