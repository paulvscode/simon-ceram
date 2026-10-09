import Stripe from "stripe";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  // STRIPE_API_URL: local testing against a stand-in server only.
  const api = process.env.STRIPE_API_URL ? new URL(process.env.STRIPE_API_URL) : null;
  return api
    ? new Stripe(key, { host: api.hostname, port: Number(api.port), protocol: api.protocol === "http:" ? "http" : "https" })
    : new Stripe(key);
}

/** "live", "test" or "none" — shown in the admin's selling checklist. */
export function stripeMode(): "live" | "test" | "none" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_") ? "live" : key ? "test" : "none";
}
