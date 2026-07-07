import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ShowcaseGrid from "@/components/ShowcaseGrid";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main>
      <Nav />
      <Hero />
      <ShowcaseGrid products={products} />
      <Footer />
    </main>
  );
}
