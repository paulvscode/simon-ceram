// Client-safe blog helpers (lib/blog.ts imports server-only storage).
import type { BlogPostMeta } from "@/lib/blog";

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

/**
 * Square miniature of a post: the one chosen in the admin, else the first
 * image of the text. Cloudinary crops it server-side (subject-aware) so the
 * list never downloads full-size photos.
 */
export function postThumbnail(post: Pick<BlogPostMeta, "coverImageUrl" | "firstImageUrl">, size = 480): string {
  const url = post.coverImageUrl || post.firstImageUrl || "";
  return url.replace(CLOUDINARY_UPLOAD, `$1c_fill,g_auto,w_${size},h_${size}/`);
}

/** "2026-10-09" → "9 octobre 2026" (dates are calendar days, no time zone). */
export function formatPostDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today as "YYYY-MM-DD" in the visitor's/admin's local calendar. */
export function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
