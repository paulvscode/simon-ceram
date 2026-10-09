import sanitizeHtml from "sanitize-html";

export const IMAGE_SIZES = ["small", "medium", "large"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

// Allowlist matching what the admin's blog editor can produce (the legal
// page's set plus images). Applied when saving and again when rendering.
// Images only from https (Cloudinary uploads); no inline styles or handlers.
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "a", "blockquote", "img"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt", "data-size"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }),
      // Display size chosen in the editor; anything else falls back to medium.
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, "data-size": IMAGE_SIZES.includes(attribs["data-size"] as ImageSize) ? attribs["data-size"] : "medium" },
      }),
    },
    // An image whose src was refused (e.g. not https) would be an empty box.
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
  });
}

/** Plain text of an article, for automatic excerpts and meta descriptions. */
export function htmlToText(html: string): string {
  // Blocks become spaces first, so paragraphs and headings don't run together.
  const spaced = html.replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, " ");
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
