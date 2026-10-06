"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/products";
import type { Keyword } from "@/lib/keywords";
import type { ShopSettings } from "@/lib/shop-settings";

type Availability = "all" | "available" | "sold";
type Sort = "newest" | "price-asc" | "price-desc";

const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const inputClass =
  "mt-2 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-base text-ink outline-none focus:border-ink";

export default function ShopClient({
  initialProducts,
  keywords,
  settings,
}: {
  initialProducts: Product[];
  keywords: Keyword[];
  settings: ShopSettings;
}) {
  const [availability, setAvailability] = useState<Availability>("all");
  const [collection, setCollection] = useState("all");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  const collections = useMemo(
    () =>
      Array.from(new Set(initialProducts.map((p) => p.collection).filter(Boolean))).sort(),
    [initialProducts]
  );

  function toggleKeyword(id: string) {
    setSelectedKeywords((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  }

  const products = useMemo(() => {
    const min = minPrice ? Number(minPrice) * 100 : null;
    const max = maxPrice ? Number(maxPrice) * 100 : null;

    const filtered = initialProducts.filter((p) => {
      if (availability === "available" && p.sold) return false;
      if (availability === "sold" && !p.sold) return false;
      if (collection !== "all" && p.collection !== collection) return false;
      if (
        selectedKeywords.length > 0 &&
        !p.keywords.some((k) => selectedKeywords.includes(k))
      )
        return false;
      if (min !== null && p.priceCents < min) return false;
      if (max !== null && p.priceCents > max) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-asc") return a.priceCents - b.priceCents;
      if (sort === "price-desc") return b.priceCents - a.priceCents;
      return b.createdAt - a.createdAt;
    });
  }, [initialProducts, availability, collection, selectedKeywords, minPrice, maxPrice, sort]);

  return (
    <section className="grid-container py-16 md:py-24">
      <div className="grid-matrix">
        <div className="md:col-span-12">
          <h1 className="font-serif text-3xl tracking-wide">Shop</h1>
        </div>
      </div>

      <div className="grid-matrix mt-16">
        <aside className="flex flex-col gap-y-12 md:col-span-3">
          {settings.showAvailability ? (
            <div>
              <p className={labelClass}>Disponibilité</p>
              <div className="mt-4 flex flex-col gap-y-2">
                {(
                  [
                    ["all", "Toutes les pièces"],
                    ["available", "Disponible"],
                    ["sold", "Vendu"],
                  ] as [Availability, string][]
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-4 font-sans text-sm">
                    <input
                      type="radio"
                      className="accent-ink"
                      checked={availability === value}
                      onChange={() => setAvailability(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {settings.showCollections ? (
            <div>
              <p className={labelClass}>Collection</p>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="all">Toutes les collections</option>
                {collections.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {keywords.length > 0 ? (
            <div>
              <p className={labelClass}>Mots-clés</p>
              <div className="mt-4 flex flex-col gap-y-2">
                {keywords.map((keyword) => (
                  <label key={keyword.id} className="flex items-center gap-4 font-sans text-sm">
                    <input
                      type="checkbox"
                      className="accent-ink"
                      checked={selectedKeywords.includes(keyword.id)}
                      onChange={() => toggleKeyword(keyword.id)}
                    />
                    {keyword.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {settings.showPriceRange ? (
            <div>
              <p className={labelClass}>Prix (€)</p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ) : null}

          <div>
            <p className={labelClass}>Trier par</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="newest">Plus récent</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </aside>

        <div className="mt-16 md:col-start-4 md:col-span-9 md:mt-0">
          {products.length === 0 ? (
            <p className={labelClass}>Aucune pièce ne correspond à ces critères.</p>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </section>
  );
}
