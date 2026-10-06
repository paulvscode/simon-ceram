import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";

export type OrderItem = {
  productId: string;
  title: string;
  priceCents: number;
};

export type ShippingZone = "FR" | "BE";

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

// Cached read; changes are fresh read-modify-writes (see lib/json-store.ts).
async function readAll(): Promise<Order[]> {
  return (await readDocument<Order[]>("orders")) ?? [];
}

export async function getOrders(): Promise<Order[]> {
  const orders = await readAll();
  return [...orders].sort((a, b) => b.createdAt - a.createdAt);
}

export async function findOrderBySessionId(
  stripeSessionId: string
): Promise<Order | null> {
  const orders = await readAll();
  return orders.find((o) => o.stripeSessionId === stripeSessionId) ?? null;
}

export type NewOrder = Omit<Order, "id" | "createdAt">;

// Idempotent on stripeSessionId — Stripe may redeliver the same webhook event.
// A redelivery returns the stored order without writing anything.
export async function createOrder(input: NewOrder): Promise<Order> {
  let result!: Order;
  await updateDocument<Order[]>("orders", [], (orders) => {
    const existing = orders.find((o) => o.stripeSessionId === input.stripeSessionId);
    if (existing) {
      result = existing;
      return orders;
    }
    result = { ...input, id: randomUUID(), createdAt: Date.now() };
    return [...orders, result];
  });
  return result;
}

export async function markOrderShipped(id: string): Promise<void> {
  await updateDocument<Order[]>("orders", [], (orders) =>
    orders.map((o) => (o.id === id ? { ...o, status: "shipped" as const } : o))
  );
}
