import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getProductsByIds, markProductsSold } from "@/lib/products";
import { createOrder, type ShippingZone } from "@/lib/orders";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productIds = JSON.parse(session.metadata?.productIds ?? "[]") as string[];
    const shippingZone = (session.metadata?.shippingZone as ShippingZone) ?? "FR";

    const products = await getProductsByIds(productIds);
    const itemsTotalCents = products.reduce((sum, p) => sum + p.priceCents, 0);
    const shippingCents = (session.amount_total ?? 0) - itemsTotalCents;

    const address =
      session.collected_information?.shipping_details?.address ??
      session.customer_details?.address;
    const shippingAddress = address
      ? [address.line1, address.line2, address.postal_code, address.city, address.country]
          .filter(Boolean)
          .join(", ")
      : "";

    await markProductsSold(productIds);
    await createOrder({
      stripeSessionId: session.id,
      items: products.map((p) => ({
        productId: p.id,
        title: p.title,
        priceCents: p.priceCents,
      })),
      itemsTotalCents,
      shippingCents: Math.max(0, shippingCents),
      shippingZone,
      totalCents: session.amount_total ?? itemsTotalCents,
      customerEmail: session.customer_details?.email ?? "",
      customerName:
        session.collected_information?.shipping_details?.name ??
        session.customer_details?.name ??
        "",
      shippingAddress,
      status: "paid",
    });
  }

  return NextResponse.json({ received: true });
}
