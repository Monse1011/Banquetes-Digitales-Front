"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminRequests, approveAdminRequest, type AdminRequest } from "@/lib/api/admin";
import { AdminRequestsContent } from "@/components/admin/admin-requests-content";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminPage() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleApprove(requestId: number) {
    if (!token) {
      return;
    }

    await approveAdminRequest(token, requestId);

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.request_id === requestId
          ? { ...request, status: "Aprobada" }
          : request,
      ),
    );
  }


  useEffect(() => {
    if (!token || user?.role !== "admin") {
      router.replace("/login");
      return;
    }

    const authToken = token;

    async function loadRequests() {
      try {
        setError("");

        const response = await getAdminRequests(authToken);

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
  }, [token, user?.role, router]);

  return (
    <main className="p-10">
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

          <AdminRequestsContent
            isLoading={isLoading}
            error={error}
            requests={requests}
            onApprove={handleApprove}
          />
        </section>
      </section>
    </main>
  );
}