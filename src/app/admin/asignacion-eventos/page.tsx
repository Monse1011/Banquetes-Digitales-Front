"use client";

import { useMemo, useState } from "react";

import { AssignmentModal } from "@/components/admin/assignments/assignment-modal";
import { AssignmentsContent } from "@/components/admin/assignments/assignments-content";
import { AssignmentsFilters } from "@/components/admin/assignments/assignments-filters";
import {
  MOCK_ASSIGNMENT_REQUEST_DETAILS,
  MOCK_ASSIGNMENT_REQUESTS,
  MOCK_AVAILABLE_LOGISTICS_USERS,
} from "@/components/admin/assignments/assignment-mocks";
import type {
  AssignmentRequest,
  AssignmentRequestDetail,
  AvailableLogisticsUser,
} from "@/components/admin/assignments/assignment-types";

export default function AssignmentEventsPage() {
  const [requests, setRequests] = useState<AssignmentRequest[]>(
    MOCK_ASSIGNMENT_REQUESTS,
  );

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<AssignmentRequest | null>(null);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        request.folio.toLowerCase().includes(normalizedSearch) ||
        request.client_name.toLowerCase().includes(normalizedSearch);

      const matchesDate =
        selectedDate.length === 0 ||
        request.event_date === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [requests, search, selectedDate]);

  const selectedRequestDetail = selectedRequest
    ? MOCK_ASSIGNMENT_REQUEST_DETAILS[selectedRequest.request_id]
    : null;

  function handleAssign(request: AssignmentRequest) {
    setSelectedRequest(request);
  }

  function handleCloseModal() {
    setSelectedRequest(null);
  }

  function handleConfirmAssignment(
    request: AssignmentRequestDetail,
    user: AvailableLogisticsUser,
  ) {
    console.log("Asignación confirmada:", {
      requestId: request.request_id,
      userId: user.id,
    });

    setRequests((currentRequests) =>
      currentRequests.filter(
        (currentRequest) =>
          currentRequest.request_id !== request.request_id,
      ),
    );

    setSelectedRequest(null);
  }

  function handleViewEvents(user: AvailableLogisticsUser) {
    console.log("Consultar eventos de:", user);
  }

  return (
    <>
      <main className="p-10">
        <section className="mx-auto flex max-w-6xl flex-col gap-6">
          <header>
            <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
              Asignación de Eventos
            </h1>

            <p className="mt-1 text-sm text-[#7A5055]">
              Asigna personal de logística a los eventos aprobados
            </p>
          </header>

          <AssignmentsFilters
            search={search}
            selectedDate={selectedDate}
            onSearchChange={setSearch}
            onDateChange={setSelectedDate}
          />

          <AssignmentsContent
            requests={filteredRequests}
            onAssign={handleAssign}
          />
        </section>
      </main>

      {selectedRequestDetail && (
        <AssignmentModal
          request={selectedRequestDetail}
          users={MOCK_AVAILABLE_LOGISTICS_USERS}
          onClose={handleCloseModal}
          onConfirm={handleConfirmAssignment}
          onViewEvents={handleViewEvents}
        />
      )}
    </>
  );
}