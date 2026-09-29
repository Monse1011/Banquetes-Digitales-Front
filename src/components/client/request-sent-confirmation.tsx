"use client";

type RequestSentConfirmationProps = {
  folio: string;
};

export function RequestSentConfirmation({
  folio,
}: RequestSentConfirmationProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5EBE8] px-4">
      <section className="w-full max-w-xl rounded-sm border border-[#E8D8DB] bg-[#FDFAF8] px-8 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#6B2737]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B2737"
            strokeWidth="1.8"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <p className="mt-6 text-xs font-medium tracking-[0.2em] text-[#6B2737] uppercase">
          Banquetes Elegancia
        </p>

        <h1
          className="mt-3 text-3xl font-semibold text-[#2C1A1D]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Solicitud enviada
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#7A5055]">
          Hemos recibido correctamente su solicitud de reservación.
          Nuestro equipo revisará la información y se pondrá en contacto
          con usted.
        </p>

        <div className="mx-auto mt-8 max-w-sm border-y border-[#E8D8DB] py-5">
          <p className="text-xs font-medium tracking-[0.12em] text-[#9A7075] uppercase">
            Folio de solicitud
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-[0.08em] text-[#6B2737]">
            {folio}
          </p>
        </div>
      </section>
    </main>
  );
}