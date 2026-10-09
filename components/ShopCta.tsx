/**
 * Call-to-action into the full catalog, placed on the /vitrine page after the
 * Vitrine grid. 3 / 6 / 3 column split per claude.MD §1.
 */
export default function ShopCta() {
  return (
    <div className="grid-matrix items-start border-t border-ink/10 pt-16">
      <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50 md:col-span-3">
        La boutique
      </p>
      <p className="mt-4 font-sans text-2xl leading-snug tracking-wide text-ink md:col-start-4 md:col-span-6 md:mt-0 md:text-3xl">
        Toutes les pièces de l&rsquo;atelier, disponibles à l&rsquo;unité.
      </p>
      <div className="mt-8 md:col-start-10 md:col-span-3 md:mt-0 md:text-right">
        <a
          href="/shop"
          className="inline-block bg-ink px-8 py-4 font-sans text-[11px] uppercase tracking-widest text-canvas transition-colors hover:bg-ink/80"
        >
          Voir la boutique
        </a>
      </div>
    </div>
  );
}
