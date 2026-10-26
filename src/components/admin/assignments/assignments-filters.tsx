type AssignmentsFiltersProps = {
  search: string;
  selectedDate: string;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
};

export function AssignmentsFilters({
  search,
  selectedDate,
  onSearchChange,
  onDateChange,
}: AssignmentsFiltersProps) {
  return (
    <div className="flex w-full gap-4">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar por folio o cliente..."
        className="min-w-0 flex-1 rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#5A3A3E] outline-none placeholder:text-[#B8A0A4] focus:border-[#6B2737]"
      />

      <input
        type="date"
        value={selectedDate}
        onChange={(event) => onDateChange(event.target.value)}
        className="w-[180px] rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm text-[#5A3A3E] outline-none focus:border-[#6B2737]"
      />
    </div>
  );
}