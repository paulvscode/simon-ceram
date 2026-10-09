import type { HeroText } from "@/lib/hero-text";

// The phrase sits on a light, slightly translucent, blurred panel so it reads
// on ANY background image and slider setting (even on pure black, canvas at
// 85% keeps ink text far above WCAG AA). Shared with the admin's preview so
// what the client sees there matches the site.
export const HERO_PANEL_CLASS = "bg-canvas/85 backdrop-blur-md";

// Text is edited in the admin (Site tab → Texte d'accueil).
export default function Hero({ hero }: { hero: HeroText }) {
  return (
    <section className="grid-container flex min-h-screen items-center py-16">
      <div className="grid-matrix w-full">
        <div className={`p-6 md:col-span-7 md:p-12 ${HERO_PANEL_CLASS}`}>
          <p className="whitespace-pre-line font-sans text-3xl italic leading-snug tracking-wide text-ink md:text-4xl lg:text-5xl">
            {hero.quote}
          </p>
          {hero.signature ? (
            <p className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink/60">
              {hero.signature}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
