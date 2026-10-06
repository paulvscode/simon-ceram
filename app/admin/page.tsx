import Dashboard from "@/components/admin/Dashboard";
import { getProducts } from "@/lib/products";
import { getShopSettings } from "@/lib/shop-settings";
import { getHomeBackground, getLegalPage } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, shopSettings, homeBackground, legalPage] = await Promise.all([
    getProducts(),
    getShopSettings(),
    getHomeBackground(),
    getLegalPage(),
  ]);
  return (
    <Dashboard
      initialProducts={products}
      initialShopSettings={shopSettings}
      initialHomeBackground={homeBackground}
      initialLegalPage={legalPage}
    />
  );
}
