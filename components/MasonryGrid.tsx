import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

// Shared between /shop and the homepage's "Selected Works" section.
// CSS multi-column masonry: images size to their natural aspect ratio,
// so columns settle into an organic, staggered rhythm rather than a
// uniform grid. See claude.MD §2.
export default function MasonryGrid({ products }: { products: Product[] }) {
  return (
    <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
      {products.map((product) => (
        <div key={product.id} className="mb-16 break-inside-avoid">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
