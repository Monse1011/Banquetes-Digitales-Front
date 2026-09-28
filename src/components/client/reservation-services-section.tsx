import type { ClientService } from "@/lib/api/client";

type ReservationServicesSectionProps = {
  services: ClientService[];
  servicesLoading: boolean;
  servicesError: string;
  touched: boolean;
  error?: string;
  selectedServiceIds: number[];
  onToggleService: (serviceId: number) => void;
};

export function ReservationServicesSection({
  services,
  servicesLoading,
  servicesError,
  touched,
  error,
  selectedServiceIds,
  onToggleService,
}: ReservationServicesSectionProps) {
  return (
    <section className="rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] p-6">
      <SectionHeader />

      {touched && error && (
        <p className="mb-3 text-xs text-[#C0392B]">{error}</p>
      )}

      {servicesLoading && (
        <p className="text-sm text-[#7A5055]">
          Cargando servicios disponibles...
        </p>
      )}

      {servicesError && (
        <p className="text-sm text-[#C0392B]">{servicesError}</p>
      )}

      {!servicesLoading && !servicesError && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {services.map((service) => {
            const checked = selectedServiceIds.includes(service.id);

            return (
              <label
                key={service.id}
                className={[
                  "flex cursor-pointer select-none items-center gap-3",
                  "rounded-sm border px-4 py-3 transition-all",
                  checked
                    ? "border-[#6B2737] bg-[#F5EBE8]"
                    : "border-[#D4BFC2] bg-white hover:border-[#A0707A]",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleService(service.id)}
                  className="sr-only"
                />

                <div
                  className={[
                    "flex h-4 w-4 shrink-0 items-center justify-center",
                    "rounded-sm border transition-all",
                    checked
                      ? "border-[#6B2737] bg-[#6B2737]"
                      : "border-[#D4BFC2]",
                  ].join(" ")}
                >
                  {checked && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <span
                  className={[
                    "text-sm",
                    checked
                      ? "font-medium text-[#2C1A1D]"
                      : "text-[#5A3A3E]",
                  ].join(" ")}
                >
                  {service.nombre}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#6B2737] text-xs font-semibold text-white">
        03
      </span>

      <h2
        className="text-lg font-semibold text-[#2C1A1D]"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Servicios Solicitados
      </h2>
    </div>
  );
}