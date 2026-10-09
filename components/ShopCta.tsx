/**
 * Call-to-action into the full catalog, placed on the homepage after the
 * Vitrine grid: just the button, centred.
 */
export default function ShopCta() {
  return (
    <div className="flex justify-center">
      <a
        href="/shop"
        className="inline-block bg-ink px-8 py-4 font-sans text-[11px] uppercase tracking-widest text-canvas transition-colors hover:bg-ink/80"
      >
        Voir la boutique
      </a>
    </div>
  );
}
