"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useCartProducts } from "@/lib/use-cart-products";
import { formatEuros } from "@/lib/format";
import type { ShippingZone } from "@/lib/orders";

const FRANCE_SHIPPING_CENTS = Number(
  process.env.NEXT_PUBLIC_SHIPPING_RATE_FRANCE_CENTS ?? 0
);
const INTL_SHIPPING_CENTS = Number(
  process.env.NEXT_PUBLIC_SHIPPING_RATE_INTL_CENTS ?? 0
);

export default function PanierPage() {
  const { removeFromCart } = useCart();
  const { items, loading } = useCartProducts();
  const [shippingZone, setShippingZone] = useState<ShippingZone>("FR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unavailable = items.filter((p) => p.sold);
  const available = items.filter((p) => !p.sold);
  const itemsTotalCents = available.reduce((sum, p) => sum + p.priceCents, 0);
  const shippingCents = shippingZone === "FR" ? FRANCE_SHIPPING_CENTS : INTL_SHIPPING_CENTS;
  const totalCents = itemsTotalCents + shippingCents;

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: available.map((p) => p.id),
        shippingZone,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitting(false);
      setError(body.error ?? "Impossible de lancer le paiement.");
      return;
    }

    window.location.href = body.url;
  }

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <div className="md:col-span-12">
            <h1 className="font-serif text-3xl tracking-wide">Panier</h1>
          </div>
        </div>

        {loading ? null : items.length === 0 ? (
          <div className="grid-matrix mt-16">
            <p className="font-sans text-[11px] uppercase tracking-widest text-ink/40 md:col-span-6">
              Votre panier est vide.{" "}
              <a href="/shop" className="underline underline-offset-4">
                Voir les pièces
              </a>
            </p>
          </div>
        ) : (
          <div className="grid-matrix mt-16">
            <div className="md:col-span-7">
              {unavailable.length > 0 ? (
                <p className="mb-8 font-sans text-[11px] uppercase tracking-widest text-ink/60">
                  {unavailable.length === 1
                    ? "Une pièce de votre panier vient d'être vendue et a été retirée."
                    : "Plusieurs pièces de votre panier viennent d'être vendues et ont été retirées."}
                </p>
              ) : null}

              <ul className="flex flex-col gap-y-8">
                {available.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-start justify-between gap-8 border-b border-ink/10 pb-8"
                  >
                    <div>
                      <p className="font-serif text-xl">{product.title}</p>
                      <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                        {product.subtitle}
                      </p>
                      <p className="mt-2 font-serif text-lg">
                        {formatEuros(product.priceCents)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-16 md:col-start-9 md:col-span-4 md:mt-0">
              <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50">
                Livraison
              </p>
              <div className="mt-4 flex flex-col gap-y-4">
                <label className="flex items-center gap-4 font-sans text-sm">
                  <input
                    type="radio"
                    className="accent-ink"
                    checked={shippingZone === "FR"}
                    onChange={() => setShippingZone("FR")}
                  />
                  France — {formatEuros(FRANCE_SHIPPING_CENTS)}
                </label>
                <label className="flex items-center gap-4 font-sans text-sm">
                  <input
                    type="radio"
                    className="accent-ink"
                    checked={shippingZone === "INTL"}
                    onChange={() => setShippingZone("INTL")}
                  />
                  International — {formatEuros(INTL_SHIPPING_CENTS)}
                </label>
              </div>

              <div className="mt-8 border-t border-ink/10 pt-8">
                <div className="flex items-center justify-between font-sans text-sm text-ink/70">
                  <span>Sous-total</span>
                  <span>{formatEuros(itemsTotalCents)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-sans text-sm text-ink/70">
                  <span>Livraison</span>
                  <span>{formatEuros(shippingCents)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between font-serif text-xl">
                  <span>Total</span>
                  <span>{formatEuros(totalCents)}</span>
                </div>
              </div>

              {error ? (
                <p className="mt-4 font-sans text-[11px] uppercase tracking-widest text-ink/60">
                  {error}
                </p>
              ) : null}

              <button
                onClick={handleCheckout}
                disabled={submitting || available.length === 0}
                className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
              >
                {submitting ? "Redirection…" : "Passer à la commande"}
              </button>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
