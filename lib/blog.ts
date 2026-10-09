import { randomUUID } from "crypto";
import { deleteDocument, readDocument, updateDocument, writeDocument } from "@/lib/json-store";
import { slugify } from "@/lib/product-details";
import { htmlToText, sanitizeBlogHtml } from "@/lib/blog-html";

// Blog posts: metadata in one "blog" index (cheap to list), each body under
// its own "blog-post:<id>" key. Reads are cached like all site data.

export type BlogPostMeta = {
  id: string;
  // Web address (/blog/<slug>); set once from the title, kept on rename.
  slug: string;
  title: string;
  // Publication date shown on the site, "YYYY-MM-DD".
  date: string;
  tags: string[];
  // Short summary for the list; derived from the text when left empty.
  excerpt: string;
  // The miniature chosen in the admin (list thumbnail, share preview).
  coverImageUrl: string;
  // First image of the text, kept as the miniature's fallback.
  firstImageUrl?: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
};

export type BlogPost = BlogPostMeta & { html: string };

const LIMITS = { title: 160, excerpt: 400, tag: 40, tags: 12, html: 300_000 };
const EXCERPT_AUTO = 220;

const today = () => new Date().toISOString().slice(0, 10);

function newestFirst(a: BlogPostMeta, b: BlogPostMeta) {
  return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
}

async function readIndex(): Promise<BlogPostMeta[]> {
  return (await readDocument<BlogPostMeta[]>("blog")) ?? [];
}

/** Every post, drafts included (admin). Newest first. */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  return [...(await readIndex())].sort(newestFirst);
}

/** Published posts only (public). Newest first. */
export async function getPublishedPosts(): Promise<BlogPostMeta[]> {
  return (await getAllPosts()).filter((p) => p.published);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const meta = (await readIndex()).find((p) => p.slug === slug);
  return meta ? withBody(meta) : null;
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const meta = (await readIndex()).find((p) => p.id === id);
  return meta ? withBody(meta) : null;
}

/** Published posts with their text, for the expandable list on /blog. */
export async function getPublishedPostsWithBody(): Promise<BlogPost[]> {
  return Promise.all((await getPublishedPosts()).map(withBody));
}

async function withBody(meta: BlogPostMeta): Promise<BlogPost> {
  const body = await readDocument<{ html: string }>(`blog-post:${meta.id}`);
  return { ...meta, html: sanitizeBlogHtml(body?.html ?? "") };
}

// ---- Validation (admin input) ----

export type BlogPostInput = {
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  coverImageUrl: string;
  published: boolean;
  html: string;
};

export function parseBlogPostInput(body: Record<string, unknown>): { input: BlogPostInput } | { error: string } {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const title = text(body.title, LIMITS.title);
  if (!title) return { error: "Le titre est requis." };

  const date = text(body.date, 10) || today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: "Date invalide." };
  }

  const rawTags = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",") : [];
  const tags = [...new Set(rawTags.map((t) => text(t, LIMITS.tag)).filter(Boolean))].slice(0, LIMITS.tags);

  const html = typeof body.html === "string" ? body.html : "";
  if (html.length > LIMITS.html) return { error: "L’article est trop long." };

  const cover = text(body.coverImageUrl, 2048);
  return {
    input: {
      title,
      date,
      tags,
      excerpt: text(body.excerpt, LIMITS.excerpt),
      coverImageUrl: cover.startsWith("https://") || cover.startsWith("/images/") ? cover : "",
      published: body.published === true,
      html: sanitizeBlogHtml(html),
    },
  };
}

function autoExcerpt(input: BlogPostInput): string {
  if (input.excerpt) return input.excerpt;
  const plain = htmlToText(input.html);
  return plain.length > EXCERPT_AUTO ? `${plain.slice(0, EXCERPT_AUTO).replace(/\s+\S*$/, "")}…` : plain;
}

function firstImage(html: string): string {
  return /<img[^>]*\ssrc="([^"]+)"/.exec(html)?.[1] ?? "";
}

function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// ---- Changes (admin) ----

export async function createPost(input: BlogPostInput): Promise<BlogPostMeta> {
  const now = Date.now();
  const id = randomUUID();
  let meta!: BlogPostMeta;
  // Body first: if the index write then fails, an orphan body is harmless.
  await writeDocument(`blog-post:${id}`, { html: input.html });
  await updateDocument<BlogPostMeta[]>("blog", [], (index) => {
    const { html: _html, ...fields } = input;
    void _html;
    meta = {
      ...fields,
      excerpt: autoExcerpt(input),
      firstImageUrl: firstImage(input.html),
      id,
      slug: uniqueSlug(input.title, new Set(index.map((p) => p.slug))),
      createdAt: now,
      updatedAt: now,
    };
    return [...index, meta];
  });
  return meta;
}

export async function updatePost(id: string, input: BlogPostInput): Promise<BlogPostMeta | null> {
  let meta: BlogPostMeta | null = null;
  await updateDocument<BlogPostMeta[]>("blog", [], (index) => {
    const existing = index.find((p) => p.id === id);
    if (!existing) return index;
    const { html: _html, ...fields } = input;
    void _html;
    // The slug stays: shared links to the article keep working after a rename.
    meta = { ...existing, ...fields, excerpt: autoExcerpt(input), firstImageUrl: firstImage(input.html), updatedAt: Date.now() };
    return index.map((p) => (p.id === id ? meta! : p));
  });
  if (meta) await writeDocument(`blog-post:${id}`, { html: input.html });
  return meta;
}

export async function deletePost(id: string): Promise<void> {
  await updateDocument<BlogPostMeta[]>("blog", [], (index) => index.filter((p) => p.id !== id));
  await deleteDocument(`blog-post:${id}`);
}
