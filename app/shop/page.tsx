import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <main>
      <Nav />
      <ShopClient initialProducts={products} />
      <Footer />
    </main>
  );
}
