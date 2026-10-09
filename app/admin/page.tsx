import Dashboard from "@/components/admin/Dashboard";
import { getProducts } from "@/lib/products";
import { getShopSettings } from "@/lib/shop-settings";
import {
  getHeroText,
  getHomeBackground,
  getLegalPage,
  getPointsDeVente,
  getProcessSection,
} from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, shopSettings, homeBackground, legalPage, processSection, heroText, pointsDeVente] = await Promise.all([
    getProducts(),
    getShopSettings(),
    getHomeBackground(),
    getLegalPage(),
    getProcessSection(),
    getHeroText(),
    getPointsDeVente(),
  ]);
  return (
    <Dashboard
      initialProducts={products}
      initialShopSettings={shopSettings}
      initialHomeBackground={homeBackground}
      initialLegalPage={legalPage}
      initialProcessSection={processSection}
      initialHeroText={heroText}
      initialPointsDeVente={pointsDeVente}
    />
  );
}
