import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getProductsByIds, markProductsSold } from "@/lib/products";
import { createOrder, findOrderBySessionId, type ShippingZone } from "@/lib/orders";
import { claimSale, releaseHoldsForSession, releaseSaleClaim } from "@/lib/reservations";

export function sessionProductIds(session: Stripe.Checkout.Session): string[] {
  try {
    const ids = JSON.parse(session.metadata?.productIds ?? "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * A Checkout payment succeeded: record the order and mark its pieces sold —
 * unless one of them is already gone, in which case the whole payment is
 * refunded and recorded as such. Safe to run again for the same session
 * (Stripe redelivers webhooks).
 */
export async function fulfilCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const productIds = sessionProductIds(session);
  if (await findOrderBySessionId(session.id)) {
    await releaseHoldsForSession(productIds, session.id);
    return;
  }

  const claims = await Promise.all(productIds.map((id) => claimSale(id, session.id)));
  const products = await getProductsByIds(productIds);
  const gone = productIds.filter((id, i) => {
    const product = products.find((p) => p.id === id);
    // Lost to another payment, deleted, or sold by other means before this
    // session claimed it (a redelivery of our own claim is fine).
    return !product || !claims[i].won || (claims[i].fresh && product.sold);
  });

  const shippingZone: ShippingZone = session.metadata?.shippingZone === "BE" ? "BE" : "FR";
  const itemsTotalCents = products.reduce((sum, p) => sum + p.priceCents, 0);
  const address =
    session.collected_information?.shipping_details?.address ?? session.customer_details?.address;
  const common = {
    stripeSessionId: session.id,
    items: products.map((p) => ({ productId: p.id, title: p.title, priceCents: p.priceCents })),
    itemsTotalCents,
    shippingCents: Math.max(0, (session.amount_total ?? 0) - itemsTotalCents),
    shippingZone,
    totalCents: session.amount_total ?? itemsTotalCents,
    customerEmail: session.customer_details?.email ?? "",
    customerName:
      session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? "",
    shippingAddress: address
      ? [address.line1, address.line2, address.postal_code, address.city, address.country].filter(Boolean).join(", ")
      : "",
  };

  if (gone.length > 0) {
    // Give back the pieces this session did win, so others can buy them.
    await Promise.all(
      productIds.map((id, i) => (claims[i].fresh && !gone.includes(id) ? releaseSaleClaim(id, session.id) : null))
    );
    const paymentIntent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (paymentIntent) {
      // Idempotency key: a redelivered webhook never refunds twice.
      await getStripe().refunds.create(
        { payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { reason: "piece_unavailable" } },
        { idempotencyKey: `refund-${session.id}` }
      );
    }
    const titles = gone.map((id) => products.find((p) => p.id === id)?.title ?? "pièce supprimée");
    await createOrder({
      ...common,
      status: "refunded",
      refundNote: `Remboursée automatiquement : ${titles.join(", ")} n’était plus disponible.`,
    });
  } else {
    await markProductsSold(productIds);
    await createOrder({ ...common, status: "paid" });
  }
  await releaseHoldsForSession(productIds, session.id);
}
