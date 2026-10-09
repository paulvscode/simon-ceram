"use client";

import { useCart } from "@/lib/cart-context";
import { formatEuros } from "@/lib/format";

// Price + add/remove-from-cart for a piece's own page (larger than the card's).
export default function ProductPurchase({
  productId,
  priceCents,
  sold,
  vatText,
}: {
  productId: string;
  priceCents: number;
  sold: boolean;
  vatText: string;
}) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inCart = isInCart(productId);

  return (
    <div>
      <p className="font-sans text-2xl text-ink">{formatEuros(priceCents)}</p>
      <p className="mt-2 font-sans text-xs text-ink/50">{vatText}</p>
      {sold ? (
        <p className="mt-4 font-sans text-[11px] uppercase tracking-widest text-ink/50">
          Pièce vendue
        </p>
      ) : (
        <button
          onClick={() => (inCart ? removeFromCart(productId) : addToCart(productId))}
          className={`mt-8 w-full px-8 py-4 font-sans text-[11px] uppercase tracking-widest transition-colors ${
            inCart
              ? "border border-ink text-ink hover:bg-ink/5"
              : "bg-ink text-canvas hover:bg-ink/80"
          }`}
        >
          {inCart ? "Retirer du panier" : "Ajouter au panier"}
        </button>
      )}
    </div>
  );
}
