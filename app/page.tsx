import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import MasonryGrid from "@/components/MasonryGrid";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";

export const dynamic = "force-dynamic";

const SELECTED_WORKS_LABEL = "selected works";

export default async function HomePage() {
  const [products, keywords] = await Promise.all([getProducts(), getKeywords()]);

  const selectedWorksKeyword = keywords.find(
    (k) => k.label.trim().toLowerCase() === SELECTED_WORKS_LABEL
  );
  const selectedWorks = selectedWorksKeyword
    ? products.filter((p) => p.keywords.includes(selectedWorksKeyword.id))
    : [];

  return (
    <>
      <HeroBackground />
      <main className="relative z-10">
        <Nav />
        <Hero />

        {selectedWorks.length > 0 ? (
          <section className="grid-container bg-canvas py-16 md:py-24">
            <div className="grid-matrix">
              <div className="md:col-span-12">
                <h2 className="font-serif text-3xl tracking-wide">Selected Works</h2>
              </div>
            </div>
            <div className="mt-16">
              <MasonryGrid products={selectedWorks} />
            </div>
          </section>
        ) : null}

        <Footer />
      </main>
    </>
  );
}
