import { Redis } from "@upstash/redis";
import { revalidateTag, unstable_cache } from "next/cache";

/*
 * All site data lives as small JSON documents, one Redis key each, in
 * Upstash Redis (free plan: 500k commands/month, 256 MB). This replaced
 * Vercel Blob, whose Hobby quota (2,000 list/put a month) got the store
 * blocked when every read did a list().
 *
 * Reads go through Next's data cache, kept until a save invalidates it, so a
 * page view costs no Redis command at all; a save costs one GET + one SET.
 * Redis is strongly consistent, so unlike the old Blob setup there is no
 * versioned-file / stale-CDN workaround.
 */

export type DocumentKey =
  | "products"
  | "keywords"
  | "orders"
  | "contact-messages"
  | "shop-settings"
  | "home-background"
  | "legal"
  | "process-section"
  | "hero"
  | "points-de-vente"
  // Blog: an index of posts (metadata) + one key per post body, so a large
  // blog never hits Upstash's per-request size limit.
  | "blog"
  | `blog-post:${string}`;

// Thrown when storage is unreachable or misconfigured, instead of a cryptic
// error further down. Pages and API routes turn it into a clear message.
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

/** JSON 503 for API routes, so the admin can show a clear storage warning. */
export function storageUnavailable(error: unknown): Response {
  console.error(error);
  return Response.json(
    { error: "Le stockage des données ne répond pas. Réessayez plus tard." },
    { status: 503 }
  );
}

let client: Redis | null = null;
function redis(): Redis {
  if (!client) {
    // Reads UPSTASH_REDIS_REST_URL/TOKEN, or the KV_REST_API_URL/TOKEN names
    // that the Vercel Marketplace integration creates.
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    if (!url) {
      throw new StorageError(
        "Stockage non configuré : ajoutez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN (ou KV_REST_API_URL et KV_REST_API_TOKEN)."
      );
    }
    client = Redis.fromEnv();
  }
  return client;
}

const redisKey = (key: DocumentKey) => `site:${key}`;
const tagFor = (key: DocumentKey) => `json-store:${key}`;

async function readFromStore<T>(key: DocumentKey): Promise<T | null> {
  try {
    // The client stores JSON and parses it back automatically.
    return (await redis().get<T>(redisKey(key))) ?? null;
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(`Stockage inaccessible : ${error instanceof Error ? error.message : error}`);
  }
}

// Vercel keeps the data cache across deployments. Scoping it to the
// deployment means a redeploy always starts from what's in Redis — needed
// whenever Redis is changed outside the app (scripts/migrate-from-blob.mjs,
// the Upstash console), since only the app's own saves invalidate the cache.
const CACHE_SCOPE = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "local";

/** Cached read for page renders and API GETs. Costs nothing until a save. */
export function readDocument<T>(key: DocumentKey): Promise<T | null> {
  return unstable_cache(() => readFromStore<T>(key), ["json-store", CACHE_SCOPE, key], {
    tags: [tagFor(key)],
  })();
}

async function writeToStore(key: DocumentKey, data: unknown): Promise<void> {
  try {
    await redis().set(redisKey(key), data);
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(`Enregistrement impossible : ${error instanceof Error ? error.message : error}`);
  }
  // Expire immediately (not stale-while-revalidate): the admin expects to see
  // their save on the very next request.
  revalidateTag(tagFor(key), { expire: 0 });
}

/** Remove a document (e.g. a deleted blog post's body). */
export async function deleteDocument(key: DocumentKey): Promise<void> {
  try {
    await redis().del(redisKey(key));
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(`Suppression impossible : ${error instanceof Error ? error.message : error}`);
  }
  revalidateTag(tagFor(key), { expire: 0 });
}

/** Replace a document wholesale (settings-style saves). */
export async function writeDocument(key: DocumentKey, data: unknown): Promise<void> {
  await writeToStore(key, data);
}

/**
 * Read-modify-write on fresh data (never the cache), for collections like
 * products or orders where a stale base would silently drop a change.
 * Returning `current` itself means "nothing changed" and skips the write.
 */
export async function updateDocument<T>(
  key: DocumentKey,
  fallback: T,
  update: (current: T) => T | Promise<T>
): Promise<T> {
  const data = await readFromStore<T>(key);
  const current = data ?? fallback;
  const next = await update(current);
  if (next === current && data !== null) return next;
  await writeToStore(key, next);
  return next;
}
