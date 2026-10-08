"use client";

import type { CalendarEvent } from "./calendar-types";

type Props = {
  currentMonth: Date;
  selectedDate: string;
  events: CalendarEvent[];
  showCancelled: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
  onToggleCancelled: () => void;
};

const WEEK_DAYS = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);

  const mondayIndex =
    firstDay.getDay() === 0
      ? 6
      : firstDay.getDay() - 1;

  const startDate = new Date(
    year,
    monthIndex,
    1 - mondayIndex,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);

    date.setDate(startDate.getDate() + index);

    return {
      date,
      key: toDateKey(date),
      isCurrentMonth:
        date.getMonth() === monthIndex,
    };
  });
}

export function MonthCalendar({
  currentMonth,
  selectedDate,
  events,
  showCancelled,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  onToggleCancelled,
}: Props) {
  const cells = getMonthCells(currentMonth);

  const visibleEvents = events.filter(
    (event) =>
      showCancelled ||
      event.status !== "CANCELLED",
  );

  const monthLabel =
    new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    }).format(currentMonth);

  function hasEvents(dateKey: string) {
    return visibleEvents.some((event) =>
      event.start_datetime.startsWith(dateKey),
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-3 py-2 text-[#6B2737]"
          >
            ‹
          </button>

          <h2 className="font-display text-[22px] font-semibold capitalize text-[#2C1A1D]">
            {monthLabel}
          </h2>

          <button
            type="button"
            onClick={onNextMonth}
            className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-3 py-2 text-[#6B2737]"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleCancelled}
            className="flex items-center gap-3 rounded border border-[#E8D8DB] bg-[#FDFAF8] px-4 py-2.5"
          >
            <span className="text-sm text-[#2C1A1D]">
              Mostrar cancelados
            </span>

            <span
              className={`flex h-5 w-9 rounded-full p-0.5 ${
                showCancelled
                  ? "justify-end bg-[#6B2737]"
                  : "justify-start bg-[#D4BFC2]"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white" />
            </span>
          </button>

          <div className="rounded border border-[#E8D8DB] bg-[#FDFAF8] px-4 py-2.5 text-sm text-[#2C1A1D]">
            Vista: Mes
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-[#E8D8DB] bg-[#FDFAF8] p-5">
        <div className="grid grid-cols-7 pb-3">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[13px] font-semibold text-[#7A5055]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const isSelected =
              cell.key === selectedDate;

            const eventExists =
              hasEvents(cell.key);

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() =>
                  onSelectDate(cell.key)
                }
                className="flex min-h-[76px] flex-col items-center gap-1 border-t border-[#E8D8DB] py-3"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isSelected
                      ? "bg-[#6B2737] font-semibold text-white"
                      : cell.isCurrentMonth
                        ? "text-[#2C1A1D]"
                        : "text-[#B8A0A4]"
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                {eventExists && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6B2737]" />
                )}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}