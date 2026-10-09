import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { randomUUID } from "crypto";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { ShippingZone } from "@/lib/orders";
import { storageUnavailable } from "@/lib/json-store";
import {
  attachSessionToHolds,
  CHECKOUT_LIFETIME_SECONDS,
  holdProducts,
  releaseHoldsForBuyer,
} from "@/lib/reservations";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "La boutique n'est pas encore configurée pour le paiement." },
      { status: 503 }
    );
  }

  const {
    productIds: rawIds,
    shippingZone,
    buyerToken: rawToken,
    acceptedTerms,
  } = (await request.json().catch(() => ({}))) as {
    productIds?: unknown;
    shippingZone?: ShippingZone;
    buyerToken?: unknown;
    acceptedTerms?: unknown;
  };
  const productIds = Array.isArray(rawIds)
    ? [...new Set(rawIds.filter((id): id is string => typeof id === "string"))].slice(0, 50)
    : [];
  // Identifies this browser across retries (see lib/reservations.ts).
  const buyerToken =
    typeof rawToken === "string" && /^[A-Za-z0-9-]{8,64}$/.test(rawToken) ? rawToken : randomUUID();

  if (acceptedTerms !== true) {
    return NextResponse.json(
      { error: "Merci d’accepter les conditions générales de vente." },
      { status: 400 }
    );
  }

  if (productIds.length === 0) {
    return NextResponse.json({ error: "Le panier est vide." }, { status: 400 });
  }

  const zone: ShippingZone = shippingZone === "BE" ? "BE" : "FR";

  try {
    return await startCheckout(request, productIds, zone, buyerToken);
  } catch (error) {
    return storageUnavailable(error);
  }
}

async function startCheckout(
  request: NextRequest,
  productIds: string[],
  zone: ShippingZone,
  buyerToken: string
): Promise<NextResponse | Response> {
  const products = await getProductsByIds(productIds);
  const missingOrSold = productIds.filter(
    (id) => !products.some((p) => p.id === id && !p.sold && p.online)
  );

  if (missingOrSold.length > 0) {
    return NextResponse.json(
      { error: "Une ou plusieurs pièces ne sont plus disponibles." },
      { status: 409 }
    );
  }

  const shippingCents =
    zone === "FR"
      ? Number(process.env.NEXT_PUBLIC_SHIPPING_RATE_FRANCE_CENTS ?? 0)
      : Number(process.env.NEXT_PUBLIC_SHIPPING_RATE_INTL_CENTS ?? 0);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const stripe = getStripe();

  // Reserve the pieces before opening the payment page.
  const hold = await holdProducts(productIds, buyerToken);
  if (!hold.ok) {
    const titles = products
      .filter((p) => hold.takenIds.includes(p.id))
      .map((p) => `« ${p.title} »`);
    return NextResponse.json(
      {
        error: `${titles.join(", ")} ${titles.length > 1 ? "sont" : "est"} en cours d’achat par un autre visiteur. Si son paiement n’aboutit pas, ${titles.length > 1 ? "elles seront" : "elle sera"} de nouveau disponible${titles.length > 1 ? "s" : ""} d’ici 30 minutes.`,
        takenIds: hold.takenIds,
      },
      { status: 409 }
    );
  }
  // Same browser retrying: close its previous payment page so it can't
  // also be paid.
  await Promise.all(
    hold.previousSessionIds.map((id) => stripe.checkout.sessions.expire(id).catch(() => null))
  );

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      // The payment page closes after 30 minutes; the holds then expire too.
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_LIFETIME_SECONDS,
      line_items: products.map((product) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: product.priceCents,
          product_data: {
            name: product.title,
            description: product.subtitle || undefined,
          },
        },
      })),
      // Delivery is currently limited to France and Belgium only.
      shipping_address_collection: {
        allowed_countries: zone === "FR" ? ["FR"] : ["BE"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "eur" },
            display_name: zone === "FR" ? "Livraison France" : "Livraison Belgique",
          },
        },
      ],
      metadata: {
        productIds: JSON.stringify(productIds),
        shippingZone: zone,
        buyerToken,
      },
      success_url: `${siteUrl}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/panier`,
    });
  } catch (error) {
    await releaseHoldsForBuyer(productIds, buyerToken);
    console.error("Stripe checkout:", error);
    return NextResponse.json(
      {
        error: "Le paiement n’a pas pu être lancé. Réessayez dans un instant.",
      },
      { status: 502 }
    );
  }

  await attachSessionToHolds(productIds, buyerToken, session.id);
  return NextResponse.json({ url: session.url });
}
