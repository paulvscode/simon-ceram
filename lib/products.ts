import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";

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
  // "En ligne" / "Hors ligne": offline pieces are hidden from every public
  // surface (homepage, shop, cart, checkout) but stay editable in the admin.
  online: boolean;
  createdAt: number;
};

const SEED_FILE = path.join(process.cwd(), "data", "products.json");

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
    // Pieces created before the switch existed were all public.
    online: p.online ?? true,
    createdAt: p.createdAt ?? Date.now(),
  }));
}

async function loadSeed(): Promise<Partial<Product>[]> {
  return JSON.parse(await fs.readFile(SEED_FILE, "utf-8")) as Partial<Product>[];
}

// Cached (see lib/json-store.ts): page views cost no storage operations.
// Reads never write — Next forbids cache invalidation during a render — so
// before anything is stored this serves the bundled seed, and the first admin
// change persists it (mutateProducts starts from the same seed).
async function readAll(): Promise<Product[]> {
  const stored = await readDocument<Partial<Product>[]>("products");
  return normalize(stored ?? (await loadSeed()));
}

// Every change goes through one fresh read-modify-write, never the cache.
// `change` returns null for "nothing to do", which skips the write.
async function mutateProducts(change: (products: Product[]) => Product[] | null): Promise<void> {
  await updateDocument<Partial<Product>[]>("products", await loadSeed(), (raw) => change(normalize(raw)) ?? raw);
}

/** Only "en ligne" pieces: what visitors may see and buy. */
export async function getPublicProducts(): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.online);
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
  | "online"
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

  if (body.online !== undefined) {
    if (typeof body.online !== "boolean") return { error: "Valeur « en ligne » invalide." };
    fields.online = body.online;
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
  const product: Product = {
    id: randomUUID(),
    ...input,
    sold: false,
    keywords: [],
    createdAt: Date.now(),
  };
  await mutateProducts((products) => [...products, product]);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  await mutateProducts((products) => products.filter((p) => p.id !== id));
}

export async function markProductsSold(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  await mutateProducts((products) =>
    products.map((p) => (idSet.has(p.id) ? { ...p, sold: true } : p))
  );
}

export type ProductPatch = Partial<ProductFields> & { keywords?: string[] };

export async function updateProduct(id: string, patch: ProductPatch): Promise<Product | null> {
  let updated: Product | null = null;
  await mutateProducts((products) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return null;
    updated = { ...existing, ...patch };
    return products.map((p) => (p.id === id ? updated! : p));
  });
  return updated;
}

// Cascade cleanup when a keyword is deleted from the master list.
export async function removeKeywordFromAllProducts(keywordId: string): Promise<void> {
  await mutateProducts((products) =>
    products.some((p) => p.keywords.includes(keywordId))
      ? products.map((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== keywordId) }))
      : null
  );
}
