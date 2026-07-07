"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { formatEuros } from "@/lib/format";

const PATTERN = [
  "md:col-start-2 md:col-span-5", // Pattern A — whitespace right
  "md:col-start-8 md:col-span-4", // Pattern B — whitespace left
  "md:col-start-4 md:col-span-6", // Pattern C — centered
] as const;

export function patternForIndex(index: number): string {
  return PATTERN[index % 3];
}

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <article className={patternForIndex(index)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink/5">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className={`h-full w-full object-cover ${product.sold ? "grayscale" : ""}`}
          />
        ) : null}
        {product.sold ? (
          <span className="absolute left-4 top-4 bg-canvas px-3 py-1 font-sans text-[11px] uppercase tracking-widest text-ink">
            Vendu
          </span>
        ) : null}
      </div>
      <h3 className="mt-8 font-serif text-2xl tracking-wide text-ink">{product.title}</h3>
      <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
        {product.subtitle}
      </p>
      {product.description ? (
        <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-ink/70">
          {product.description}
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-8">
        <p className="font-serif text-lg text-ink">{formatEuros(product.priceCents)}</p>
        {!product.sold ? (
          <button
            onClick={() => (inCart ? removeFromCart(product.id) : addToCart(product.id))}
            className="font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 hover:text-ink/70"
          >
            {inCart ? "Retirer du panier" : "Ajouter au panier"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
