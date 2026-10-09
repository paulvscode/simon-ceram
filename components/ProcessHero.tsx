import type { ProcessSection } from "@/lib/process-section";

/**
 * The /processus page body: headline, full-bleed image (same treatment as the
 * Atelier page banner), then numbered steps — 4 per row on desktop, 2 on
 * tablet, stacked on phones. Content is edited in the admin (Site tab).
 */
export default function ProcessHero({ section }: { section: ProcessSection }) {
  return (
    <section id="processus" className="bg-canvas">
      <div className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          {section.label ? (
            <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50 md:col-span-12">
              {section.label}
            </p>
          ) : null}
          {section.title ? (
            <h1 className="mt-8 font-sans text-3xl italic leading-snug tracking-wide text-ink md:col-span-9 md:text-4xl lg:col-span-8">
              {section.title}
            </h1>
          ) : null}
          {section.intro ? (
            <p className="mt-8 whitespace-pre-line font-sans text-sm leading-relaxed text-ink/70 md:col-span-6 lg:col-span-5">
              {section.intro}
            </p>
          ) : null}
        </div>
      </div>

      {section.imageUrl ? (
        <div className="relative h-[50vh] w-full md:h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={section.imageUrl}
            alt={section.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      {section.steps.length > 0 ? (
        <div className="grid-container py-16 md:py-24">
          <ol className="grid-matrix gap-y-12 md:gap-y-16">
            {section.steps.map((step, index) => (
              <li key={index} className="border-t border-ink pt-4 md:col-span-6 lg:col-span-3">
                <p className="font-sans text-[11px] uppercase tracking-widest text-ink/40">
                  {String(index + 1).padStart(2, "0")}
                </p>
                {step.title ? (
                  <h3 className="mt-4 font-sans text-xl tracking-wide text-ink">{step.title}</h3>
                ) : null}
                {step.text ? (
                  <p className="mt-4 whitespace-pre-line font-sans text-sm leading-relaxed text-ink/70">
                    {step.text}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
