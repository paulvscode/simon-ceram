import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ShopCta from "@/components/ShopCta";
import { getPublicProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";
import { isVitrine } from "@/lib/vitrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vitrine — Simon Barraud de Lagerie" };

// The pieces switched on with the admin's "Vitrine" toggle (online only),
// then the call-to-action into the full shop.
export default async function VitrinePage() {
  const [products, keywords] = await Promise.all([getPublicProducts(), getKeywords()]);
  const vitrine = keywords.find(isVitrine);
  const featured = vitrine ? products.filter((p) => p.keywords.includes(vitrine.id)) : [];

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <h1 className="font-sans text-3xl tracking-wide md:col-span-12">Vitrine</h1>
        </div>
        <div className="mt-16">
          {featured.length > 0 ? (
            <ProductGrid products={featured} />
          ) : (
            <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50">
              Une sélection de pièces sera bientôt présentée ici.
            </p>
          )}
        </div>
        <div className="mt-16">
          <ShopCta />
        </div>
      </section>
      <Footer />
    </main>
  );
}
