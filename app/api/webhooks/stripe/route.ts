import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfilCheckout, sessionProductIds } from "@/lib/checkout-fulfil";
import { releaseHoldsForSession } from "@/lib/reservations";

// Events to enable on the Stripe webhook endpoint:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed, checkout.session.expired
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // Delayed methods (e.g. bank debit) complete unpaid; they're handled
      // by async_payment_succeeded once the money is actually in.
      if (session.payment_status !== "unpaid") await fulfilCheckout(session);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await fulfilCheckout(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      await releaseHoldsForSession(sessionProductIds(session), session.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
