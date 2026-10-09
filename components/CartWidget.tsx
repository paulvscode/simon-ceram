"use client";

import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { formatEuros } from "@/lib/format";
import { navLinkClass } from "./NavLinks";

export default function CartWidget() {
  const { cart, removeFromCart, isDrawerOpen, openDrawer, closeDrawer } = useCart();
  const { items, loading } = useCartProducts();
  // Count what can actually be shown (pieces taken offline or deleted drop
  // out of `items`); fall back to the stored ids while loading.
  const count = loading ? cart.length : items.length;

  const available = items.filter((p) => !p.sold);
  const totalCents = available.reduce((sum, p) => sum + p.priceCents, 0);

  return (
    <>
      {count > 0 ? (
        <button onClick={openDrawer} aria-label={`Panier (${count})`} className={`flex items-center ${navLinkClass}`}>
          {/* Phones: a count badge — "PANIER (n)" doesn't fit beside the long
              wordmark and the menu button. From sm, the full label. */}
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-canvas sm:hidden"
          >
            {count}
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            Panier ({count})
          </span>
        </button>
      ) : null}

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-[200]">
          <button
            aria-label="Fermer le panier"
            onClick={closeDrawer}
            className="absolute inset-0 bg-ink/30"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-ink/10 bg-canvas p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xl tracking-wide">Panier</h2>
              <button
                onClick={closeDrawer}
                className="font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink"
              >
                Fermer
              </button>
            </div>

            <div className="mt-16 flex-1">
              {loading ? null : available.length === 0 ? (
                <p className="font-sans text-[11px] uppercase tracking-widest text-ink/40">
                  Votre panier est vide.
                </p>
              ) : (
                <ul className="flex flex-col gap-y-8">
                  {available.map((product) => (
                    <li key={product.id} className="flex gap-4">
                      <div className="h-24 w-20 shrink-0 overflow-hidden bg-ink/5">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="font-sans text-base leading-snug">{product.title}</p>
                        <p className="mt-2 font-sans text-sm text-ink/70">
                          {formatEuros(product.priceCents)}
                        </p>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink"
                        >
                          Retirer
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {available.length > 0 ? (
              <div className="mt-16 border-t border-ink/10 pt-8">
                <div className="flex items-center justify-between font-sans text-lg">
                  <span>Sous-total</span>
                  <span>{formatEuros(totalCents)}</span>
                </div>
                <a
                  href="/panier"
                  className="mt-8 block text-center font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4"
                >
                  Voir le panier
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
