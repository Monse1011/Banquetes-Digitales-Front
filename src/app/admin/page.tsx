"use client";

import { useEffect, useState } from "react";
import { getAdminRequests, type AdminRequest } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminPage() {
  const { token, user } = useAuth();

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    async function loadRequests() {
      try {
        setError("");

        const response = await getAdminRequests(token);

        setRequests(response.data);
      } catch (error) {
        const typedError = error as Error & { status?: number };

        if (typedError.status === 403) {
          setError(
            "El backend rechazó el acceso al panel administrativo.",
          );
        } else {
          setError(
            typedError.message ||
              "No fue posible cargar las solicitudes.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#F5EBE8] px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-xs font-medium tracking-[0.2em] text-[#6B2737] uppercase">
            Banquetes Elegancia
          </p>

          <h1
            className="mt-3 text-3xl font-semibold text-[#2C1A1D]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Panel Administrativo
          </h1>

          {user && (
            <p className="mt-2 text-sm text-[#7A5055]">
              Bienvenido, {user.full_name}
            </p>
          )}
        </header>

        <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
          <div className="mb-6">
            <h2
              className="text-xl font-semibold text-[#2C1A1D]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Solicitudes de reservación
            </h2>

            <p className="mt-1 text-sm text-[#7A5055]">
              Solicitudes recibidas de clientes.
            </p>
          </div>

          {isLoading && (
            <p className="text-sm text-[#7A5055]">
              Cargando solicitudes...
            </p>
          )}

          {!isLoading && error && (
            <div className="rounded-sm border border-[#E6B8B8] bg-[#FFF4F2] px-4 py-3">
              <p className="text-sm text-[#C0392B]">{error}</p>
            </div>
          )}

          {!isLoading && !error && requests.length === 0 && (
            <p className="text-sm text-[#7A5055]">
              No hay solicitudes registradas.
            </p>
          )}

          {!isLoading && !error && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8D8DB]">
                    <th className="px-4 py-3 font-medium text-[#5A3A3E]">
                      Folio
                    </th>
                    <th className="px-4 py-3 font-medium text-[#5A3A3E]">
                      Cliente
                    </th>
                    <th className="px-4 py-3 font-medium text-[#5A3A3E]">
                      Fecha
                    </th>
                    <th className="px-4 py-3 font-medium text-[#5A3A3E]">
                      Servicios
                    </th>
                    <th className="px-4 py-3 font-medium text-[#5A3A3E]">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.folio}
                      className="border-b border-[#E8D8DB] last:border-b-0"
                    >
                      <td className="px-4 py-4 font-medium text-[#6B2737]">
                        {request.folio}
                      </td>

                      <td className="px-4 py-4 text-[#2C1A1D]">
                        {request.client_name}
                      </td>

                      <td className="px-4 py-4 text-[#5A3A3E]">
                        {request.requested_date}
                      </td>

                      <td className="px-4 py-4 text-[#5A3A3E]">
                        {request.selected_services.join(", ")}
                      </td>

                      <td className="px-4 py-4 text-[#5A3A3E]">
                        {request.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}