import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { list } from "@vercel/blob";
import { readLatestJson, writeJsonVersion } from "@/lib/blob-json";

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  // Optional second image, cross-faded in over imageUrl on hover.
  hoverImageUrl: string;
  priceCents: number;
  sold: boolean;
  collection: string;
  keywords: string[];
  // Off by default: the description shows on the site only when enabled per piece.
  showDescription: boolean;
  createdAt: number;
};

const BLOB_PREFIX = "products/";
// Products used to live in one overwritten file (stale-read bug, see
// lib/blob-json.ts). It's still read once as a fallback until the first save.
const LEGACY_BLOB_PATHNAME = "products.json";
const SEED_FILE = path.join(process.cwd(), "data", "products.json");

async function readLegacy(): Promise<Partial<Product>[] | null> {
  const { blobs } = await list({ prefix: LEGACY_BLOB_PATHNAME, limit: 1 });
  const url = blobs.find((b) => b.pathname === LEGACY_BLOB_PATHNAME)?.url;
  if (!url) return null;
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as Partial<Product>[];
}

async function writeAll(products: Product[]): Promise<void> {
  await writeJsonVersion(BLOB_PREFIX, "products.json", products);
}

// Fills defaults for records written before priceCents/sold/collection/keywords/showDescription/hoverImageUrl existed.
function normalize(raw: Partial<Product>[]): Product[] {
  return raw.map((p) => ({
    id: p.id!,
    title: p.title ?? "",
    subtitle: p.subtitle ?? "",
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? "",
    hoverImageUrl: p.hoverImageUrl ?? "",
    priceCents: p.priceCents ?? 0,
    sold: p.sold ?? false,
    collection: p.collection ?? "",
    keywords: p.keywords ?? [],
    showDescription: p.showDescription ?? false,
    createdAt: p.createdAt ?? Date.now(),
  }));
}

async function readAll(): Promise<Product[]> {
  const stored = (await readLatestJson<Partial<Product>[]>(BLOB_PREFIX)) ?? (await readLegacy());
  if (stored) return normalize(stored);

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

// Fields an admin can set when creating or editing a piece.
export type ProductFields = Pick<
  Product,
  | "title"
  | "subtitle"
  | "description"
  | "imageUrl"
  | "hoverImageUrl"
  | "priceCents"
  | "collection"
  | "showDescription"
>;

const TEXT_FIELDS = [
  "title",
  "subtitle",
  "description",
  "imageUrl",
  "hoverImageUrl",
  "collection",
] as const;

// Validates an admin request body (priceEuros in euros, everything else as
// stored). Only the fields present are returned, so it serves both create
// (where the route then requires title + price) and partial edits.
export function parseProductFields(
  body: Record<string, unknown>
): { fields: Partial<ProductFields> & { keywords?: string[] } } | { error: string } {
  const fields: Partial<ProductFields> & { keywords?: string[] } = {};

  for (const key of TEXT_FIELDS) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== "string") return { error: `Champ « ${key} » invalide.` };
    fields[key] = value.trim();
  }
  if (fields.title !== undefined && !fields.title) {
    return { error: "Le titre est requis." };
  }

  if (body.priceEuros !== undefined) {
    // Accepts "18,50" as well as "18.50" — phones in French locale type a comma.
    const raw = String(body.priceEuros).trim().replace(",", ".");
    const priceCents = Math.round(Number(raw) * 100);
    if (raw === "" || !Number.isFinite(priceCents) || priceCents < 0) {
      return { error: "Le prix doit être un nombre positif." };
    }
    fields.priceCents = priceCents;
  }

  if (body.showDescription !== undefined) {
    if (typeof body.showDescription !== "boolean") return { error: "Valeur d’affichage invalide." };
    fields.showDescription = body.showDescription;
  }

  if (body.keywords !== undefined) {
    const { keywords } = body;
    if (!Array.isArray(keywords) || !keywords.every((k) => typeof k === "string")) {
      return { error: "Liste de mots-clés invalide." };
    }
    fields.keywords = keywords;
  }

  return { fields };
}

export async function addProduct(input: ProductFields): Promise<Product> {
  const products = await readAll();
  const product: Product = {
    id: randomUUID(),
    ...input,
    sold: false,
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

export type ProductPatch = Partial<ProductFields> & { keywords?: string[] };

export async function updateProduct(id: string, patch: ProductPatch): Promise<Product | null> {
  const products = await readAll();
  const existing = products.find((p) => p.id === id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await writeAll(products.map((p) => (p.id === id ? updated : p)));
  return updated;
}

// Cascade cleanup when a keyword is deleted from the master list.
export async function removeKeywordFromAllProducts(keywordId: string): Promise<void> {
  const products = await readAll();
  await writeAll(
    products.map((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== keywordId) }))
  );
}
