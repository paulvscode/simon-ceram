import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";
import { DIMENSION_FIELDS, parseMeasure, slugify, type Measures } from "@/lib/product-details";

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
  // Description on the shop/homepage cards only; the piece's own page always
  // shows it. New pieces start with it on.
  showDescription: boolean;
  // "En ligne" / "Hors ligne": offline pieces are hidden from every public
  // surface (homepage, shop, cart, checkout) but stay editable in the admin.
  online: boolean;
  // Web address of the piece's page (/shop/<slug>). Set once from the title
  // and kept even if the title changes, so shared links keep working.
  slug: string;
  createdAt: number;
} & Measures; // heightCm, widthCm, lengthCm, diameterCm, weightG — null when not given

const SEED_FILE = path.join(process.cwd(), "data", "products.json");

const MEASURE_KEYS = [...DIMENSION_FIELDS.map((f) => f.key), "weightG"] as const;

function measuresOf(p: Partial<Product>): Measures {
  const out = {} as Measures;
  for (const key of MEASURE_KEYS) {
    const v = parseMeasure(p[key]);
    out[key] = v === "invalid" ? null : v;
  }
  return out;
}

// Gives every piece without a slug a unique one, in stored order — which
// never changes — so the result is stable from one read to the next. Slugs are
// persisted with the next product save (mutateProducts writes normalized data).
function assignSlugs(products: Product[]): Product[] {
  const taken = new Set(products.map((p) => p.slug).filter(Boolean));
  return products.map((p) => {
    if (p.slug) return p;
    const base = slugify(p.title);
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    return { ...p, slug };
  });
}

// Fills defaults for records written before later fields existed.
function normalize(raw: Partial<Product>[]): Product[] {
  return assignSlugs(raw.map((p) => ({
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
    slug: p.slug ?? "",
    createdAt: p.createdAt ?? Date.now(),
    ...measuresOf(p),
  })));
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
// `change` returns null for "nothing to do", which skips the write. The result
// is normalized again before saving, so new pieces get their slug (and older
// pieces get theirs persisted) as part of the same write.
async function mutateProducts(change: (products: Product[]) => Product[] | null): Promise<Product[]> {
  const saved = await updateDocument<Partial<Product>[]>("products", await loadSeed(), (raw) => {
    const next = change(normalize(raw));
    return next ? normalize(next) : raw;
  });
  return normalize(saved);
}

/** The public page's piece: online only (offline pieces 404). */
export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  return (await getPublicProducts()).find((p) => p.slug === slug) ?? null;
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
  | keyof Measures
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

  for (const key of MEASURE_KEYS) {
    if (body[key] === undefined) continue;
    const value = parseMeasure(body[key]);
    if (value === "invalid") return { error: "Dimensions et poids : un nombre positif, par exemple 24 ou 24,5." };
    fields[key] = value;
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
  const id = randomUUID();
  const saved = await mutateProducts((products) => [
    ...products,
    { id, ...input, sold: false, keywords: [], slug: "", createdAt: Date.now() },
  ]);
  return saved.find((p) => p.id === id)!;
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
