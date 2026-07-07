import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { ShippingZone } from "@/lib/orders";

// Countries offered under the "International" shipping option. Edit this
// list to match wherever the atelier is actually willing to ship.
const INTL_COUNTRIES = [
  "FR", "BE", "CH", "DE", "ES", "IT", "GB", "IE", "NL", "LU", "PT", "AT",
  "DK", "SE", "NO", "FI", "PL", "CZ", "US", "CA",
] as const;

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

  const zone: ShippingZone = shippingZone === "INTL" ? "INTL" : "FR";

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
    shipping_address_collection: {
      allowed_countries: zone === "FR" ? ["FR"] : [...INTL_COUNTRIES],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCents, currency: "eur" },
          display_name: zone === "FR" ? "Livraison France" : "Livraison internationale",
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
