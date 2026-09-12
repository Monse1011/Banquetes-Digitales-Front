
"use client";

import { useAuth } from "@/lib/auth/auth-context";

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5EBE8] px-4">
      <section className="w-full max-w-xl rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-10 text-center shadow-sm">
        <p className="text-xs font-medium tracking-[0.2em] text-[#6B2737] uppercase">
          Banquetes Elegancia
        </p>

        <h1
          className="mt-3 text-3xl font-semibold text-[#2C1A1D]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Panel Administrativo
        </h1>

        <p className="mt-4 text-sm text-[#7A5055]">
          Sesión iniciada correctamente.
        </p>

        {user && (
          <div className="mt-6 border-t border-[#E8D8DB] pt-5 text-sm text-[#5A3A3E]">
            <p>{user.full_name}</p>
            <p className="mt-1">{user.email}</p>
            <p className="mt-1">Rol: {user.role}</p>
          </div>
        )}
      </section>
    </main>
  );
}