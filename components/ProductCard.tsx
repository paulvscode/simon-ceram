import type { Product } from "@/lib/products";

const PATTERN = [
  "md:col-start-2 md:col-span-5", // Pattern A — whitespace right
  "md:col-start-8 md:col-span-4", // Pattern B — whitespace left
  "md:col-start-4 md:col-span-6", // Pattern C — centered
] as const;

export function patternForIndex(index: number): string {
  return PATTERN[index % 3];
}

export default function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <article className={patternForIndex(index)}>
      <div className="aspect-[3/4] w-full overflow-hidden bg-ink/5">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
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
    </article>
  );
}
