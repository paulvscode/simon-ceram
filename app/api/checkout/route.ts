import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { ShippingZone } from "@/lib/orders";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "La boutique n'est pas encore configurée pour le paiement." },
      { status: 503 }
    );
  }

  const { productIds, shippingZone } = (await request.json()) as {
    productIds?: string[];
    shippingZone?: ShippingZone;
  };

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: "Le panier est vide." }, { status: 400 });
  }

  const zone: ShippingZone = shippingZone === "BE" ? "BE" : "FR";

  const products = await getProductsByIds(productIds);
  const missingOrSold = productIds.filter(
    (id) => !products.some((p) => p.id === id && !p.sold)
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
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
    },
    success_url: `${siteUrl}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/panier`,
  });

  return NextResponse.json({ url: session.url });
}
