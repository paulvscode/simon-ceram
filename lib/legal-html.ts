import sanitizeHtml from "sanitize-html";

// Allowlist matching exactly what the admin's rich-text toolbar can produce.
// Applied when saving and again when rendering, so the public page can never
// carry scripts, inline styles or event handlers.
export function sanitizeLegalHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "a", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });
}
