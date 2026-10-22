type AdminRequestsPaginationProps = {
  page: number;
  perPage: number;
  totalRecords: number;
  visibleRecords: number;
  disabled: boolean;
  showRange: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

const buttonClass =
  "rounded border border-[#D4BFC2] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40";

export function AdminRequestsPagination({
  page,
  perPage,
  totalRecords,
  visibleRecords,
  disabled,
  showRange,
  onPageChange,
  onPerPageChange,
}: AdminRequestsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
  const first = visibleRecords ? (page - 1) * perPage + 1 : 0;
  const last = visibleRecords ? first + visibleRecords - 1 : 0;

  return (
    <nav
      aria-label="Paginación de solicitudes"
      className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#E8D8DB] pt-4 text-sm text-[#5A3A3E]"
    >
      <div className="space-y-2">
        {showRange && (
          <p role="status">
            Mostrando {first}–{last} de {totalRecords} solicitudes.
          </p>
        )}
        <label className="flex items-center gap-2">
          Solicitudes por página
          <select
            value={perPage}
            disabled={disabled}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="rounded border border-[#D4BFC2] bg-white p-2 disabled:opacity-40"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonClass}
          disabled={disabled || page <= 1} onClick={() => onPageChange(1)}>
          Primera
        </button>
        <button type="button" className={buttonClass}
          disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </button>
        <span className="px-2">Página {page} de {totalPages}</span>
        <button type="button" className={buttonClass}
          disabled={disabled || page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </button>
        <button type="button" className={buttonClass}
          disabled={disabled || page >= totalPages} onClick={() => onPageChange(totalPages)}>
          Última
        </button>
      </div>
    </nav>
  );
}
