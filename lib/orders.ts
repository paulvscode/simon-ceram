import { randomUUID } from "crypto";
import { list, put } from "@vercel/blob";

export type OrderItem = {
  productId: string;
  title: string;
  priceCents: number;
};

export type ShippingZone = "FR" | "INTL";

export type Order = {
  id: string;
  stripeSessionId: string;
  items: OrderItem[];
  itemsTotalCents: number;
  shippingCents: number;
  shippingZone: ShippingZone;
  totalCents: number;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  status: "paid" | "shipped";
  createdAt: number;
};

const BLOB_PATHNAME = "orders.json";

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  return blobs.find((b) => b.pathname === BLOB_PATHNAME)?.url ?? null;
}

async function writeAll(orders: Order[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(orders, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readAll(): Promise<Order[]> {
  const url = await findBlobUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as Order[];
}

export async function getOrders(): Promise<Order[]> {
  const orders = await readAll();
  return orders.sort((a, b) => b.createdAt - a.createdAt);
}

export async function findOrderBySessionId(
  stripeSessionId: string
): Promise<Order | null> {
  const orders = await readAll();
  return orders.find((o) => o.stripeSessionId === stripeSessionId) ?? null;
}

export type NewOrder = Omit<Order, "id" | "createdAt">;

// Idempotent on stripeSessionId — Stripe may redeliver the same webhook event.
export async function createOrder(input: NewOrder): Promise<Order> {
  const orders = await readAll();
  const existing = orders.find((o) => o.stripeSessionId === input.stripeSessionId);
  if (existing) return existing;

  const order: Order = {
    ...input,
    id: randomUUID(),
    createdAt: Date.now(),
  };
  orders.push(order);
  await writeAll(orders);
  return order;
}

export async function markOrderShipped(id: string): Promise<void> {
  const orders = await readAll();
  await writeAll(
    orders.map((o) => (o.id === id ? { ...o, status: "shipped" as const } : o))
  );
}
