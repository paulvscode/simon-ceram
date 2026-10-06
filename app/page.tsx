import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import ProcessHero from "@/components/ProcessHero";
import ShopCta from "@/components/ShopCta";
import { getPublicProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";
import { getHomeBackground, getProcessSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const SELECTED_WORKS_LABEL = "selected works";

export default async function HomePage() {
  const [products, keywords, background, process] = await Promise.all([
    getPublicProducts(),
    getKeywords(),
    getHomeBackground(),
    getProcessSection(),
  ]);

  const selectedWorksKeyword = keywords.find(
    (k) => k.label.trim().toLowerCase() === SELECTED_WORKS_LABEL
  );
  const selectedWorks = selectedWorksKeyword
    ? products.filter((p) => p.keywords.includes(selectedWorksKeyword.id))
    : [];

  return (
    <>
      <HeroBackground background={background} />
      <main className="relative z-10">
        <Nav />
        <Hero />

        {/* Selected Works (only when some piece carries the tag), always
            followed by the call-to-action into /shop. */}
        <section className="grid-container bg-canvas py-16 md:py-24">
          {selectedWorks.length > 0 ? (
            <>
              <div className="grid-matrix">
                <div className="md:col-span-12">
                  <h2 className="font-serif text-3xl tracking-wide">Selected Works</h2>
                </div>
              </div>
              <div className="mt-16">
                <ProductGrid products={selectedWorks} />
              </div>
            </>
          ) : null}
          <ShopCta />
        </section>

        <ProcessHero section={process} />

        <Footer />
      </main>
    </>
  );
}
