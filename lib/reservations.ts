import { kvClaim, kvDelete, kvGet, kvSet } from "@/lib/json-store";

/*
 * Pieces are unique, so two buyers must never pay for the same one.
 *
 * 1. Hold: opening checkout reserves each piece for the life of the Stripe
 *    payment page (30 min + margin). Another visitor gets a clear "being
 *    bought" message instead of a payment page. The hold expires on its own,
 *    and is released early when Stripe reports the page expired.
 *    Value: "<buyer token>|<Stripe session id>" — the buyer token lets the
 *    same browser go back and retry checkout without locking itself out.
 *
 * 2. Sale claim: when a payment succeeds, the first session to claim a piece
 *    wins it. Any other payment for it (e.g. the piece was sold at a market
 *    in the meantime) is refunded automatically (lib/checkout-fulfil.ts).
 */

// Stripe's minimum lifetime for a Checkout page is 30 minutes.
export const CHECKOUT_LIFETIME_SECONDS = 30 * 60 + 60;
const HOLD_SECONDS = CHECKOUT_LIFETIME_SECONDS + 2 * 60;
// Long enough to cover Stripe's webhook retries (up to 3 days).
const SALE_CLAIM_SECONDS = 7 * 24 * 60 * 60;

const holdKey = (productId: string) => `hold:${productId}`;
const saleKey = (productId: string) => `sale:${productId}`;
const buyerOf = (holder: string) => holder.split("|")[0];
const sessionOf = (holder: string) => holder.split("|")[1] ?? "";

export type HoldResult =
  | { ok: true; previousSessionIds: string[] }
  | { ok: false; takenIds: string[] };

/** Reserve every piece for this buyer, or none of them. */
export async function holdProducts(productIds: string[], buyerToken: string): Promise<HoldResult> {
  const taken: string[] = [];
  const claimed: string[] = [];
  const previousSessionIds: string[] = [];

  for (const id of productIds) {
    const { owner, fresh } = await kvClaim(holdKey(id), buyerToken, HOLD_SECONDS);
    if (fresh) {
      claimed.push(id);
    } else if (owner && buyerOf(owner) === buyerToken) {
      // Same browser retrying: take the hold over; its old payment page will
      // be closed so it can't be paid as well.
      if (sessionOf(owner)) previousSessionIds.push(sessionOf(owner));
      await kvSet(holdKey(id), buyerToken, HOLD_SECONDS);
      claimed.push(id);
    } else if (owner === null) {
      // Expired between the two calls: try once more.
      const retry = await kvClaim(holdKey(id), buyerToken, HOLD_SECONDS);
      (retry.fresh ? claimed : taken).push(id);
    } else {
      taken.push(id);
    }
  }

  if (taken.length > 0) {
    await Promise.all(claimed.map((id) => releaseHold(id, (h) => buyerOf(h) === buyerToken)));
    return { ok: false, takenIds: taken };
  }
  return { ok: true, previousSessionIds: [...new Set(previousSessionIds)] };
}

/** Attach the Stripe session to the holds, so its expiry can release them. */
export async function attachSessionToHolds(productIds: string[], buyerToken: string, sessionId: string) {
  await Promise.all(productIds.map((id) => kvSet(holdKey(id), `${buyerToken}|${sessionId}`, HOLD_SECONDS)));
}

async function releaseHold(productId: string, isOurs: (holder: string) => boolean) {
  const holder = await kvGet(holdKey(productId));
  if (holder && isOurs(holder)) await kvDelete(holdKey(productId));
}

/** Free the pieces held by a Stripe session (paid, expired or failed). */
export async function releaseHoldsForSession(productIds: string[], sessionId: string) {
  await Promise.all(productIds.map((id) => releaseHold(id, (h) => sessionOf(h) === sessionId)));
}

/** Release the holds of a buyer whose payment page couldn't be created. */
export async function releaseHoldsForBuyer(productIds: string[], buyerToken: string) {
  await Promise.all(productIds.map((id) => releaseHold(id, (h) => buyerOf(h) === buyerToken)));
}

/**
 * Claim a piece for a successful payment. `won` is true if this session owns
 * it; `fresh` is false on a webhook redelivery for the same session.
 */
export async function claimSale(productId: string, sessionId: string) {
  const { owner, fresh } = await kvClaim(saleKey(productId), sessionId, SALE_CLAIM_SECONDS);
  return { won: owner === sessionId, fresh };
}

export async function releaseSaleClaim(productId: string, sessionId: string) {
  if ((await kvGet(saleKey(productId))) === sessionId) await kvDelete(saleKey(productId));
}
