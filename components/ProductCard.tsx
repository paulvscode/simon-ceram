"use client";

import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { formatEuros } from "@/lib/format";
import { sizeLine } from "@/lib/product-details";
import ProductImages from "./ProductImages";

export default function ProductCard({ product }: { product: Product }) {
  const { isInCart, addToCart, removeFromCart } = useCart();
  const inCart = isInCart(product.id);
  const href = `/shop/${product.slug}`;
  const size = sizeLine(product);

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
      <h3 className="mt-8 font-serif text-2xl tracking-wide text-ink">
        <a href={href} className="transition-colors duration-400 hover:text-ink/70">
          {product.title}
        </a>
      </h3>
      <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
        {product.subtitle}
      </p>
      {size ? (
        <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">{size}</p>
      ) : null}
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
