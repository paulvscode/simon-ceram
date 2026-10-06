"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/products";

// Phone-only layout choice, remembered in this browser (a per-visitor
// convenience: if storage is unavailable it simply resets to one per row).
const STORAGE_KEY = "product-grid-columns";
type PhoneColumns = 1 | 2;

function readChoice(): PhoneColumns {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "2" ? 2 : 1;
  } catch {
    return 1;
  }
}

function LayoutButton({
  columns,
  active,
  onSelect,
}: {
  columns: PhoneColumns;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={columns === 1 ? "Une pièce par ligne" : "Deux pièces par ligne"}
      className={`flex h-10 w-10 items-center justify-center transition-colors ${
        active ? "text-ink" : "text-ink/30 hover:text-ink/60"
      }`}
    >
      {/* Icon: one wide square, or a 2×2 grid of small ones. */}
      {columns === 1 ? (
        <span aria-hidden="true" className="block h-4 w-4 bg-current" />
      ) : (
        <span aria-hidden="true" className="grid grid-cols-2 gap-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-2 w-2 bg-current" />
          ))}
        </span>
      )}
    </button>
  );
}

// Shared between /shop and the homepage's "Vitrine" section. Every picture
// is the same square (see lib/product-image.ts), so this is a regular grid
// read row by row: on phones 1 or 2 per row (the visitor's choice), 2 from
// `sm`, 3 from `lg`, fixed gutters per claude.MD §1.
export default function ProductGrid({ products }: { products: Product[] }) {
  const [phoneColumns, setPhoneColumns] = useState<PhoneColumns>(1);

  // After mount only: the server can't know the stored choice.
  useEffect(() => setPhoneColumns(readChoice()), []);

  function choose(columns: PhoneColumns) {
    setPhoneColumns(columns);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(columns));
    } catch {
      // Private mode / blocked storage: the choice just won't persist.
    }
  }

  const compact = phoneColumns === 2;

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2 sm:hidden">
        <span className="mr-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">Affichage</span>
        <LayoutButton columns={1} active={!compact} onSelect={() => choose(1)} />
        <LayoutButton columns={2} active={compact} onSelect={() => choose(2)} />
      </div>
      <ul
        className={`grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 ${
          compact ? "grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-8" : "grid-cols-1"
        }`}
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} compact={compact} />
          </li>
        ))}
      </ul>
    </div>
  );
}
