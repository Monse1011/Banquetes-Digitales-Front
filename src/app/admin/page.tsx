"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminRequests,
  approveAdminRequest,
  type AdminRequest,
} from "@/lib/api/admin";
import { AdminRequestsContent } from "@/components/admin/admin-requests-content";
import { AdminRequestsPagination } from "@/components/admin/admin-requests-pagination";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const approving = useRef(new Set<number>());
  const [approvingIds, setApprovingIds] = useState<number[]>([]);
  const [approvalErrors, setApprovalErrors] = useState<Record<number, string>>(
    {},
  );

  async function handleApprove(requestId: number) {
    if (!user || approving.current.has(requestId)) {
      return;
    }

    approving.current.add(requestId);
    setApprovingIds([...approving.current]);
    setApprovalErrors((current) => ({ ...current, [requestId]: "" }));
    try {
      const approved = await approveAdminRequest(requestId);
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.request_id === requestId
            ? { ...request, status: approved.status }
            : request,
        ),
      );
    } catch (cause) {
      setApprovalErrors((current) => ({
        ...current,
        [requestId]:
          cause instanceof Error
            ? cause.message
            : "No fue posible aprobar la solicitud. Intenta de nuevo.",
      }));
    } finally {
      approving.current.delete(requestId);
      setApprovingIds([...approving.current]);
    }
  }

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    async function loadRequests() {
      let redirectingToLastPage = false;
      try {
        setIsLoading(true);
        setError("");

        const response = await getAdminRequests({
          page,
          perPage,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const total = response.metadata.pagination.total_records;
        setTotalRecords(total);
        const lastPage = Math.max(1, Math.ceil(total / perPage));
        if (page > lastPage) {
          redirectingToLastPage = true;
          setPage(lastPage);
          return;
        }

        setRequests(response.data);
      } catch (error) {
        if (controller.signal.aborted) return;
        const typedError = error as Error & { status?: number };

        if (typedError.status === 403) {
          setError("El backend rechazó el acceso al panel administrativo.");
        } else {
          setError(
            typedError.message || "No fue posible cargar las solicitudes.",
          );
        }
      } finally {
        if (!controller.signal.aborted && !redirectingToLastPage) {
          setIsLoading(false);
        }
      }
    }

    loadRequests();
    return () => controller.abort();
  }, [user?.role, router, page, perPage, refresh]);

  const controlsDisabled = isLoading || approvingIds.length > 0;
  function reloadRequests() {
    if (controlsDisabled) return;
    setIsLoading(true);
    setRefresh((value) => value + 1);
  }

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
            <button
              type="button"
              onClick={reloadRequests}
              disabled={controlsDisabled}
              className="mt-3 text-sm text-[#6B2737] underline disabled:opacity-40"
            >
              Actualizar solicitudes
            </button>
          </div>

          <AdminRequestsContent
            isLoading={isLoading}
            error={error}
            requests={requests}
            onApprove={handleApprove}
            approvingIds={approvingIds}
            approvalErrors={approvalErrors}
            onRetry={reloadRequests}
          />
          <AdminRequestsPagination
            page={page}
            perPage={perPage}
            totalRecords={totalRecords}
            visibleRecords={requests.length}
            disabled={controlsDisabled}
            showRange={!isLoading && !error}
            onPageChange={(nextPage) => {
              if (controlsDisabled || nextPage === page) return;
              setIsLoading(true);
              setPage(nextPage);
            }}
            onPerPageChange={(size) => {
              if (controlsDisabled || size === perPage) return;
              setIsLoading(true);
              setPerPage(size);
              setPage(1);
            }}
          />
        </section>
      </section>
    </main>
  );
}
