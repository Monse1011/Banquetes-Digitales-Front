"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MOCK_ASSIGNED_EVENTS } from "@/components/logistics/events/assigned-event-mocks";
import { MOCK_RESOURCE_CONFIRMATIONS } from "@/components/logistics/resource-confirmation/resource-confirmation-mocks";
import { MOCK_AGREEMENT_EVENTS } from "@/components/logistics/agreements/agreement-mocks";
import { MOCK_CALENDAR_EVENTS } from "@/components/logistics/calendar/calendar-mocks";

import type { AssignedEvent } from "@/components/logistics/events/assigned-event-types";
import type { ResourceConfirmationEvent } from "@/components/logistics/resource-confirmation/resource-confirmation-types";
import type { AgreementEventData } from "@/components/logistics/agreements/agreement-types";
import type { CalendarEvent } from "@/components/logistics/calendar/calendar-types";

type LogisticsMockContextValue = {
  assignedEvents: AssignedEvent[];
  resourceConfirmations: ResourceConfirmationEvent[];
  agreementEvents: AgreementEventData[];
  calendarEvents: CalendarEvent[];

  setAssignedEvents: React.Dispatch<
    React.SetStateAction<AssignedEvent[]>
  >;

  setResourceConfirmations: React.Dispatch<
    React.SetStateAction<ResourceConfirmationEvent[]>
  >;

  setAgreementEvents: React.Dispatch<
    React.SetStateAction<AgreementEventData[]>
  >;

  setCalendarEvents: React.Dispatch<
    React.SetStateAction<CalendarEvent[]>
  >;
};

const LogisticsMockContext =
  createContext<LogisticsMockContextValue | null>(null);

export function LogisticsMockProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [assignedEvents, setAssignedEvents] =
    useState<AssignedEvent[]>(MOCK_ASSIGNED_EVENTS);

  const [
    resourceConfirmations,
    setResourceConfirmations,
  ] = useState<ResourceConfirmationEvent[]>(
    MOCK_RESOURCE_CONFIRMATIONS,
  );

  const [agreementEvents, setAgreementEvents] =
    useState<AgreementEventData[]>(
      MOCK_AGREEMENT_EVENTS,
    );

  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);

  const value = useMemo(
    () => ({
      assignedEvents,
      resourceConfirmations,
      agreementEvents,
      calendarEvents,
      setAssignedEvents,
      setResourceConfirmations,
      setAgreementEvents,
      setCalendarEvents,
    }),
    [
      assignedEvents,
      resourceConfirmations,
      agreementEvents,
      calendarEvents,
    ],
  );

  return (
    <LogisticsMockContext.Provider value={value}>
      {children}
    </LogisticsMockContext.Provider>
  );
}

export function useLogisticsMock() {
  const context = useContext(LogisticsMockContext);

  if (!context) {
    throw new Error(
      "useLogisticsMock debe usarse dentro de LogisticsMockProvider",
    );
  }

  return context;
}