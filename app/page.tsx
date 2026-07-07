import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import ShowcaseGrid from "@/components/ShowcaseGrid";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <HeroBackground />
      <main className="relative z-10">
        <Nav />
        <Hero />
        <ShowcaseGrid products={products} />
        <Footer />
      </main>
    </>
  );
}
