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
  // "refunded": paid for a piece that was already gone (sold elsewhere or
  // by another payment), refunded automatically — see lib/checkout-fulfil.ts.
  status: "paid" | "shipped" | "refunded";
  // "F2026-0001": consecutive per year, given only to paid orders (French
  // invoices must be numbered without gaps).
  invoiceNumber?: string;
  // Why a refunded order was refunded (shown in the admin).
  refundNote?: string;
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

export type NewOrder = Omit<Order, "id" | "createdAt" | "invoiceNumber">;

function nextInvoiceNumber(orders: Order[], year: number): string {
  const prefix = `F${year}-`;
  const last = orders.reduce((max, o) => {
    if (!o.invoiceNumber?.startsWith(prefix)) return max;
    return Math.max(max, Number(o.invoiceNumber.slice(prefix.length)) || 0);
  }, 0);
  return `${prefix}${String(last + 1).padStart(4, "0")}`;
}

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
    const now = new Date();
    result = {
      ...input,
      id: randomUUID(),
      createdAt: now.getTime(),
      // Numbered here, inside the same read-modify-write, so no gaps.
      ...(input.status === "refunded" ? {} : { invoiceNumber: nextInvoiceNumber(orders, now.getFullYear()) }),
    };
    return [...orders, result];
  });
  return result;
}

export async function getOrderById(id: string): Promise<Order | null> {
  return (await readAll()).find((o) => o.id === id) ?? null;
}

export async function markOrderShipped(id: string): Promise<void> {
  await updateDocument<Order[]>("orders", [], (orders) =>
    orders.map((o) => (o.id === id && o.status === "paid" ? { ...o, status: "shipped" as const } : o))
  );
}
