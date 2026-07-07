import Dashboard from "@/components/admin/Dashboard";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const products = await getProducts();
  return <Dashboard initialProducts={products} />;
}
