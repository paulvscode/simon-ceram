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

async function readAll(): Promise<Product[]> {
  const url = await findBlobUrl();
  if (url) {
    const res = await fetch(url, { cache: "no-store" });
    return (await res.json()) as Product[];
  }

  // First run: no blob yet — seed it from the bundled seed file.
  const seedRaw = await fs.readFile(SEED_FILE, "utf-8");
  const seed = JSON.parse(seedRaw) as Product[];
  await writeAll(seed);
  return seed;
}

export async function getProducts(): Promise<Product[]> {
  const products = await readAll();
  return products.sort((a, b) => a.createdAt - b.createdAt);
}

export type NewProduct = {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
};

export async function addProduct(input: NewProduct): Promise<Product> {
  const products = await readAll();
  const product: Product = {
    id: randomUUID(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl.trim(),
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
