import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/products";
import { getKeywords } from "@/lib/keywords";
import { getShopSettings } from "@/lib/shop-settings";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, keywords, settings] = await Promise.all([
    getProducts(),
    getKeywords(),
    getShopSettings(),
  ]);

  return (
    <main>
      <Nav />
      <ShopClient initialProducts={products} keywords={keywords} settings={settings} />
      <Footer />
    </main>
  );
}
