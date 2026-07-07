import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";

/**
 * claude.MD §2: each product gets its own 12-column row so its offset
 * pattern (A/B/C, cycling on index % 3) never competes with a neighbour
 * for grid auto-placement — one product, one row, one clean matrix.
 */
export default function ShowcaseGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <section id="pieces" className="grid-container bg-canvas py-32">
        <p className="font-sans text-[11px] uppercase tracking-widest text-ink/40">
          Aucune pièce exposée pour le moment.
        </p>
      </section>
    );
  }

  return (
    <section
      id="pieces"
      className="grid-container flex flex-col gap-y-32 bg-canvas py-16 md:gap-y-48 md:py-32"
    >
      {products.map((product, index) => (
        <div key={product.id} className="grid-matrix">
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </section>
  );
}
