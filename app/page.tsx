import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import ProductGrid from "@/components/ProductGrid";
import ShopCta from "@/components/ShopCta";
import Footer from "@/components/Footer";
import { getPublicProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";
import { isVitrine } from "@/lib/vitrine";
import { getHeroText, getHomeBackground } from "@/lib/site-content";

export const dynamic = "force-dynamic";

// Landing page: menu, hero (image + phrase), the Vitrine pieces with the
// call-to-action into the shop, footer. The process has its own page
// (/processus); the old /vitrine page redirects here (next.config.mjs).
export default async function HomePage() {
  const [background, hero, products, keywords] = await Promise.all([
    getHomeBackground(),
    getHeroText(),
    getPublicProducts(),
    getKeywords(),
  ]);
  const vitrine = keywords.find(isVitrine);
  const featured = vitrine ? products.filter((p) => p.keywords.includes(vitrine.id)) : [];

  return (
    <>
      <HeroBackground background={background} />
      <main className="relative z-10">
        <Nav />
        <Hero hero={hero} />

        {/* Pieces switched on with the admin's "Vitrine" toggle (online only).
            Opaque bg-canvas so it covers the fixed hero image while scrolling;
            nothing at all when no piece is selected. */}
        {featured.length > 0 ? (
          <section id="vitrine" className="grid-container bg-canvas py-16 md:py-24">
            <div className="grid-matrix">
              <h2 className="font-sans text-3xl tracking-wide md:col-span-12">Vitrine</h2>
            </div>
            <div className="mt-16">
              <ProductGrid products={featured} />
            </div>
            <div className="mt-16">
              <ShopCta />
            </div>
          </section>
        ) : null}

        <Footer />
      </main>
    </>
  );
}
