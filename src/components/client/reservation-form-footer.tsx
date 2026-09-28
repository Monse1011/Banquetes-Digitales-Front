type ReservationFormFooterProps = {
  isValid: boolean;
  isSubmitting: boolean;
};

export function ReservationFormFooter({
  isValid,
  isSubmitting,
}: ReservationFormFooterProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-[#E8D8DB] bg-[#FDFAF8] px-4 py-4 shadow-[0_-4px_20px_rgba(107,39,55,0.08)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <p className="text-xs text-[#9A7075]">
          {isValid ? (
            <span className="font-medium text-[#2D5A3D]">
              Formulario completo, listo para enviar
            </span>
          ) : (
            "Complete todos los campos requeridos para continuar"
          )}
        </p>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={[
            "rounded-sm px-8 py-3 text-sm font-medium",
            "tracking-[0.06em] transition-all",
            isValid
              ? "bg-[#6B2737] text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)] hover:bg-[#4A1824]"
              : "cursor-not-allowed bg-[#D4BFC2] text-[#9A7075]",
          ].join(" ")}
        >
          Enviar Solicitud
        </button>
      </div>
    </div>
  );
}