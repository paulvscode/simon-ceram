import type { HeroText } from "@/lib/hero-text";

// Text is edited in the admin (Site tab → Texte d'accueil).
export default function Hero({ hero }: { hero: HeroText }) {
  return (
    <section className="grid-container flex min-h-screen items-center py-16">
      <div className="grid-matrix">
        <p className="whitespace-pre-line font-serif text-3xl italic leading-snug tracking-wide text-ink md:col-span-7 md:text-4xl lg:text-5xl">
          {hero.quote}
        </p>
        {hero.signature ? (
          <p className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink/50 md:col-start-1 md:col-span-4">
            {hero.signature}
          </p>
        ) : null}
      </div>
    </section>
  );
}
