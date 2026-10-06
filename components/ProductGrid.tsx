import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

// Shared between /shop and the homepage's "Vitrine" section.
// Every picture is the same square (see lib/product-image.ts), so this is a
// regular grid read row by row: 1 column on the narrowest phones, 2 from
// `sm`, 3 from `lg`, fixed gutters per claude.MD §1.
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
