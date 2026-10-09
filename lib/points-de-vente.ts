// Points de vente (pure: shared by the admin editor and the public page).

export type PointDeVente = {
  name: string;
  address: string;
  city: string;
  // Website or Instagram of the shop.
  url: string;
  // Opening hours, what they stock…
  note: string;
};

export const MAX_POINTS_DE_VENTE = 50;
const LIMITS = { name: 100, address: 160, city: 80, url: 300, note: 300 };

export const EMPTY_POINT_DE_VENTE: PointDeVente = { name: "", address: "", city: "", url: "", note: "" };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Shops type "www.boutique.fr" or "instagram.com/…"; links need a scheme.
// Anything that isn't plain http(s) is dropped rather than rendered.
function normalizeUrl(value: unknown): string {
  let url = text(value, LIMITS.url);
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

/** Untrusted input → clean list: trimmed, capped, unnamed entries dropped. */
export function normalizePointsDeVente(input: unknown): PointDeVente[] {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => {
      const raw = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return {
        name: text(raw.name, LIMITS.name),
        address: text(raw.address, LIMITS.address),
        city: text(raw.city, LIMITS.city),
        url: normalizeUrl(raw.url),
        note: text(raw.note, LIMITS.note),
      };
    })
    .filter((p) => p.name)
    .slice(0, MAX_POINTS_DE_VENTE);
}

/** Google Maps search link for the address, or "" when there's nothing to find. */
export function mapsUrl(p: PointDeVente): string {
  const query = [p.name, p.address, p.city].filter(Boolean).join(", ");
  return p.address || p.city ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

/** "boutique.fr" / "instagram.com/boutique" for display. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}
