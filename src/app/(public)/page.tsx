import { FAQ, GALLERY, STATS, STEPS, TESTIMONIALS, BUSINESS } from "@/components/public/content";
import { FolioLookup } from "@/components/public/folio-lookup";
import { ServicesGrid } from "@/components/public/services-grid";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
      {text ? <p className="mt-3 text-muted">{text}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(184,146,90,0.35),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(122,46,58,0.65),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Mérida · Yucatán</p>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Eventos memorables, coordinados hasta el último detalle.
            </h1>
            <p className="max-w-xl text-lg text-white/75">
              Banquetes, mobiliario, personal y logística en un solo lugar. Solicita tu cotización en minutos y da
              seguimiento a tu evento en línea.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/reservar" variant="gold" size="lg">
                Solicitar cotización
              </ButtonLink>
              <ButtonLink href="/seguimiento" variant="secondary" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Consultar mi folio
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="font-display text-xl">¿Ya tienes un folio?</p>
            <p className="mt-1 text-sm text-white/60">Consulta el estado de tu solicitud y revisa tu propuesta.</p>
            <div className="mt-5">
              <FolioLookup dark />
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-4 py-6 text-center sm:px-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-2xl text-gold sm:text-3xl">{stat.value}</dd>
                <dd className="text-xs text-white/60 sm:text-sm">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Servicios"
            title="Todo lo que tu evento necesita"
            text="Combina los servicios que quieras en una sola solicitud; nosotros coordinamos al equipo y los recursos."
          />
          <ServicesGrid />
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Cómo funciona" title="De la idea a la celebración en cuatro pasos" />
          <ol className="grid gap-6 md:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-line p-6">
                <span className="font-display text-4xl text-gold/60">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Galería */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Galería" title="Celebraciones que hemos hecho posibles" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {GALLERY.map((item, index) => (
              <div
                key={item.title}
                className={`flex aspect-[3/4] items-end rounded-2xl bg-gradient-to-br ${item.tone} p-5 text-white shadow-sm ${
                  index % 2 ? "md:translate-y-8" : ""
                }`}
              >
                <p className="font-display text-lg">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="bg-cream-dark/60 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Testimonios" title="Lo que dicen nuestros clientes" />
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item.author} className="rounded-2xl bg-white p-6 shadow-sm">
                <blockquote className="text-sm leading-relaxed">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{item.author}</span>
                  <span className="block text-xs text-muted">{item.event}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.q}
                  <Icon name="plus" className="h-4 w-4 shrink-0 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-3xl bg-wine px-6 py-14 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl">¿Listo para planear tu evento?</h2>
          <p className="max-w-xl text-white/80">
            Envía tu solicitud y recibe tu folio al instante. También puedes llamarnos al {BUSINESS.phone}.
          </p>
          <ButtonLink href="/reservar" variant="gold" size="lg">
            Solicitar cotización
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
