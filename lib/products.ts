import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { list, put } from "@vercel/blob";

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  sold: boolean;
  collection: string;
  keywords: string[];
  createdAt: number;
};

const BLOB_PATHNAME = "products.json";
const SEED_FILE = path.join(process.cwd(), "data", "products.json");

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  return blobs.find((b) => b.pathname === BLOB_PATHNAME)?.url ?? null;
}

async function writeAll(products: Product[]): Promise<void> {
  // cacheControlMaxAge: 0 — this blob is overwritten on every admin action and
  // must read back immediately; Vercel's CDN would otherwise serve a stale
  // version for its default cache window after each overwrite.
  await put(BLOB_PATHNAME, JSON.stringify(products, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

// Fills defaults for records written before priceCents/sold/collection/keywords existed.
function normalize(raw: Partial<Product>[]): Product[] {
  return raw.map((p) => ({
    id: p.id!,
    title: p.title ?? "",
    subtitle: p.subtitle ?? "",
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? "",
    priceCents: p.priceCents ?? 0,
    sold: p.sold ?? false,
    collection: p.collection ?? "",
    keywords: p.keywords ?? [],
    createdAt: p.createdAt ?? Date.now(),
  }));
}

async function readAll(): Promise<Product[]> {
  const url = await findBlobUrl();
  if (url) {
    const res = await fetch(url, { cache: "no-store" });
    return normalize((await res.json()) as Partial<Product>[]);
  }

  // First run: no blob yet — seed it from the bundled seed file.
  const seedRaw = await fs.readFile(SEED_FILE, "utf-8");
  const seed = normalize(JSON.parse(seedRaw) as Partial<Product>[]);
  await writeAll(seed);
  return seed;
}

export async function getProducts(): Promise<Product[]> {
  const products = await readAll();
  return products.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const products = await readAll();
  const idSet = new Set(ids);
  return products.filter((p) => idSet.has(p.id));
}

export type NewProduct = {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  collection: string;
};

export async function addProduct(input: NewProduct): Promise<Product> {
  const products = await readAll();
  const product: Product = {
    id: randomUUID(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl.trim(),
    priceCents: Math.max(0, Math.round(input.priceCents)),
    sold: false,
    collection: input.collection.trim(),
    keywords: [],
    createdAt: Date.now(),
  };
  products.push(product);
  await writeAll(products);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await readAll();
  await writeAll(products.filter((p) => p.id !== id));
}

export async function markProductsSold(ids: string[]): Promise<void> {
  const products = await readAll();
  const idSet = new Set(ids);
  await writeAll(
    products.map((p) => (idSet.has(p.id) ? { ...p, sold: true } : p))
  );
}

export async function setProductKeywords(id: string, keywords: string[]): Promise<void> {
  const products = await readAll();
  await writeAll(products.map((p) => (p.id === id ? { ...p, keywords } : p)));
}

// Cascade cleanup when a keyword is deleted from the master list.
export async function removeKeywordFromAllProducts(keywordId: string): Promise<void> {
  const products = await readAll();
  await writeAll(
    products.map((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== keywordId) }))
  );
}
