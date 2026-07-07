import { randomUUID } from "crypto";
import { list, put } from "@vercel/blob";

export type Keyword = {
  id: string;
  label: string;
};

const BLOB_PATHNAME = "keywords.json";

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  return blobs.find((b) => b.pathname === BLOB_PATHNAME)?.url ?? null;
}

async function writeAll(keywords: Keyword[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(keywords, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readAll(): Promise<Keyword[]> {
  const url = await findBlobUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as Keyword[];
}

export async function getKeywords(): Promise<Keyword[]> {
  const keywords = await readAll();
  return keywords.sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export async function createKeyword(label: string): Promise<Keyword> {
  const keywords = await readAll();
  const trimmed = label.trim();
  const existing = keywords.find((k) => k.label.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const keyword: Keyword = { id: randomUUID(), label: trimmed };
  keywords.push(keyword);
  await writeAll(keywords);
  return keyword;
}

export async function renameKeyword(id: string, label: string): Promise<void> {
  const keywords = await readAll();
  await writeAll(keywords.map((k) => (k.id === id ? { ...k, label: label.trim() } : k)));
}

export async function deleteKeyword(id: string): Promise<void> {
  const keywords = await readAll();
  await writeAll(keywords.filter((k) => k.id !== id));
}
