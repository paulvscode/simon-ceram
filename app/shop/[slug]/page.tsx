import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductImages from "@/components/ProductImages";
import ProductPurchase from "@/components/ProductPurchase";
import { getPublicProductBySlug, type Product } from "@/lib/products";
import { measureRows } from "@/lib/product-details";
import { productImageUrl } from "@/lib/product-image";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const SITE_NAME = "Simon Barraud de Lagerie";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";

function summary(product: Product): string {
  return product.description || product.subtitle || `${product.title} — pièce unique.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getPublicProductBySlug((await params).slug);
  if (!product) return { title: `Pièce introuvable — ${SITE_NAME}` };
  const image = product.imageUrl ? productImageUrl(product.imageUrl) : undefined;
  return {
    title: `${product.title} — ${SITE_NAME}`,
    description: summary(product),
    openGraph: { title: product.title, description: summary(product), images: image ? [image] : undefined },
  };
}

// One page per piece, generated from its data: nothing to create in the admin.
// Offline pieces 404, like everywhere else on the public site.
export default async function ProductPage({ params }: Props) {
  const product = await getPublicProductBySlug((await params).slug);
  if (!product) notFound();

  const rows = measureRows(product);
  if (product.collection) rows.unshift({ label: "Collection", value: product.collection });

  // Structured data so search engines can show the piece's price and availability.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: summary(product),
    image: product.imageUrl ? [productImageUrl(product.imageUrl)] : undefined,
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: product.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <main>
      <Nav />
      <section className="grid-container pb-16 pt-8 md:pb-24">
        <a href="/shop" className={`${labelClass} transition-colors duration-400 hover:text-ink`}>
          &larr; Retour à la boutique
        </a>

        <div className="grid-matrix mt-8">
          <div className="md:col-span-7">
            <ProductImages
              layout="page"
              title={product.title}
              imageUrl={product.imageUrl}
              hoverImageUrl={product.hoverImageUrl}
              sold={product.sold}
            />
          </div>

          <div className="mt-8 md:sticky md:top-8 md:col-start-9 md:col-span-4 md:mt-0 md:self-start">
            {product.subtitle ? <p className={labelClass}>{product.subtitle}</p> : null}
            <h1 className="mt-4 font-sans text-3xl tracking-wide text-ink md:text-4xl">{product.title}</h1>

            <div className="mt-8">
              <ProductPurchase productId={product.id} priceCents={product.priceCents} sold={product.sold} />
            </div>

            {/* Always shown here: "Afficher la description" only governs the cards. */}
            {product.description ? (
              <p className="mt-8 whitespace-pre-line font-sans text-sm leading-relaxed text-ink/70">
                {product.description}
              </p>
            ) : null}

            {rows.length > 0 ? (
              <>
                <h2 className={`mt-12 ${labelClass}`}>Caractéristiques</h2>
                <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10 font-sans text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex justify-between gap-4 py-2">
                      <dt className="text-ink/60">{row.label}</dt>
                      <dd className="text-right text-ink">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}

            <p className={`mt-8 ${labelClass}`}>Pièce unique · Livraison en France et en Belgique</p>
          </div>
        </div>
      </section>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
