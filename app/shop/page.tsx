import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, keywords] = await Promise.all([getProducts(), getKeywords()]);

  return (
    <main>
      <Nav />
      <ShopClient initialProducts={products} keywords={keywords} />
      <Footer />
    </main>
  );
}
