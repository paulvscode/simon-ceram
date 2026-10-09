import CartPage from "@/components/CartPage";
import { getSaleSettings } from "@/lib/site-content";
import { vatMention } from "@/lib/sale-settings";

export const dynamic = "force-dynamic";

// The cart itself is client-side (lib/cart-context); the server adds the
// selling texts edited in the admin (Vente tab).
export default async function PanierPage() {
  const settings = await getSaleSettings();
  return <CartPage vatText={vatMention(settings)} shippingPolicy={settings.shippingPolicy} />;
}
