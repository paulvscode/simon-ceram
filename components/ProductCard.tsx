"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { formatEuros } from "@/lib/format";
import { sizeLine } from "@/lib/product-details";
import ProductImages from "./ProductImages";

export default function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  // Phone "two per row" layout: tighter type, stacked price/button, no
  // description. Every compact style is `max-sm:`, so wider screens are untouched.
  compact?: boolean;
}) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inCart = isInCart(product.id);
  const href = `/shop/${product.slug}`;
  const size = sizeLine(product);
  // At ~156px per card, the widest tracking wraps "AJOUTER AU PANIER" and
  // size lines; a tighter tracking keeps them on one line on phones.
  const tight = compact ? "max-sm:tracking-wide" : "";

  return (
    <article>
      {/* Photo and title open the piece's page; the cart button stays separate
          (a button can't sit inside a link). */}
      <a href={href} className="block" aria-label={`Voir « ${product.title} »`}>
        <ProductImages
          title={product.title}
          imageUrl={product.imageUrl}
          hoverImageUrl={product.hoverImageUrl}
          sold={product.sold}
        />
      </a>
      <h3
        className={`mt-8 font-sans text-2xl tracking-wide text-ink ${
          compact ? "max-sm:mt-4 max-sm:text-lg max-sm:leading-6" : ""
        }`}
      >
        <a href={href} className="transition-colors duration-400 hover:text-ink/70">
          {product.title}
        </a>
      </h3>
      <p className={`mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50 ${tight}`}>
        {product.subtitle}
      </p>
      {size ? (
        <p className={`mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50 ${tight}`}>{size}</p>
      ) : null}
      {product.showDescription && product.description ? (
        <p className={`mt-4 font-sans text-sm leading-relaxed text-ink/70 ${compact ? "max-sm:hidden" : ""}`}>
          {product.description}
        </p>
      ) : null}
      <div
        className={`mt-4 flex items-center gap-8 ${
          compact ? "max-sm:mt-2 max-sm:flex-col max-sm:items-start max-sm:gap-2" : ""
        }`}
      >
        <p className={`font-sans text-lg text-ink ${compact ? "max-sm:text-base" : ""}`}>
          {formatEuros(product.priceCents)}
        </p>
        {!product.sold ? (
          <button
            onClick={() => (inCart ? removeFromCart(product.id) : addToCart(product.id))}
            className={`text-left font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 hover:text-ink/70 ${tight}`}
          >
            {inCart ? "Retirer du panier" : "Ajouter au panier"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
