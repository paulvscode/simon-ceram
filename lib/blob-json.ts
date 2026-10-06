import { del, list, put } from "@vercel/blob";

// The Blob CDN caches every URL for at least 60s and ignores both
// cacheControlMaxAge: 0 and query strings, so overwriting one fixed file
// serves stale reads — and a read-modify-write on stale data silently undoes
// the previous change. Instead each save is a new, never-overwritten file
// under `prefix`; list() hits the Blob API (not the CDN) and always sees the
// newest one. Older versions are deleted after each save.

async function listVersions(prefix: string) {
  const { blobs } = await list({ prefix });
  return blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

export async function readLatestJson<T>(prefix: string): Promise<T | null> {
  const [latest] = await listVersions(prefix);
  if (!latest) return null;
  const res = await fetch(latest.url, { cache: "no-store" });
  return (await res.json()) as T;
}

export async function writeJsonVersion(prefix: string, name: string, data: unknown): Promise<void> {
  const saved = await put(`${prefix}${name}`, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
  });

  const stale = (await listVersions(prefix)).filter((b) => b.url !== saved.url).map((b) => b.url);
  if (stale.length > 0) await del(stale);
}
