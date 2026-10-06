"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { formatEuros } from "@/lib/format";
import { productImageUrl } from "@/lib/product-image";

export default function ProductCard({ product }: { product: Product }) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inCart = isInCart(product.id);

  return (
    <article>
      <div
        className="group relative aspect-square w-full overflow-hidden bg-well"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImageUrl(product.imageUrl)}
            alt={product.title}
            loading="lazy"
            className={`block h-full w-full object-contain ${product.sold ? "grayscale" : ""}`}
          />
        ) : null}
        {product.imageUrl && product.hoverImageUrl ? (
          // Same square as the main image; cross-fades in over it on hover.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={productImageUrl(product.hoverImageUrl)}
            alt=""
            aria-hidden
            loading="lazy"
            className={`absolute inset-0 h-full w-full bg-well object-contain opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 ${
              product.sold ? "grayscale" : ""
            }`}
          />
        ) : null}
        {product.sold ? (
          <span className="absolute left-4 top-4 bg-canvas px-2 font-sans leading-6 text-[11px] uppercase tracking-widest text-ink">
            Vendu
          </span>
        ) : null}
      </div>
      <h3 className="mt-8 font-serif text-2xl tracking-wide text-ink">{product.title}</h3>
      <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
        {product.subtitle}
      </p>
      {product.showDescription && product.description ? (
        <p className="mt-4 font-sans text-sm leading-relaxed text-ink/70">
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
