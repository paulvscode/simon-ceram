import Dashboard from "@/components/admin/Dashboard";
import { getProducts } from "@/lib/products";
import { getShopSettings } from "@/lib/shop-settings";
import { getAllPosts } from "@/lib/blog";
import { stripeMode } from "@/lib/stripe";
import {
  getHeroText,
  getHomeBackground,
  getLegalPage,
  getPointsDeVente,
  getProcessSection,
  getCgvPage,
  getSaleSettings,
} from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, shopSettings, homeBackground, legalPage, processSection, heroText, pointsDeVente, blogPosts, saleSettings, cgvPage] = await Promise.all([
    getProducts(),
    getShopSettings(),
    getHomeBackground(),
    getLegalPage(),
    getProcessSection(),
    getHeroText(),
    getPointsDeVente(),
    getAllPosts(),
    getSaleSettings(),
    getCgvPage(),
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
      initialBlogPosts={blogPosts}
      initialSaleSettings={saleSettings}
      initialCgvPage={cgvPage}
      stripeMode={stripeMode()}
      webhookConfigured={Boolean(process.env.STRIPE_WEBHOOK_SECRET)}
    />
  );
}
