// Product dimensions, weight and web address (pure: shared by the admin
// form, the shop cards and the product page).

export const DIMENSION_FIELDS = [
  { key: "heightCm", label: "Hauteur", short: "H" },
  { key: "widthCm", label: "Largeur", short: "l" },
  { key: "lengthCm", label: "Longueur", short: "L" },
  { key: "diameterCm", label: "Diamètre", short: "Ø" },
] as const;

export type DimensionKey = (typeof DIMENSION_FIELDS)[number]["key"];
export type Measures = Record<DimensionKey | "weightG", number | null>;

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

// Non-breaking spaces (\u00A0) keep a number with its unit ("24 cm", "Ø 12 cm")
// so narrow layouts only ever wrap between measures.
const NBSP = "\u00A0";
export const formatCm = (cm: number) => `${number.format(cm)}${NBSP}cm`;

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${number.format(grams / 1000)}${NBSP}kg` : `${number.format(grams)}${NBSP}g`;
}

/** Labelled rows for the product page's "Caractéristiques" — filled ones only. */
export function measureRows(measures: Measures): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = DIMENSION_FIELDS.filter(
    ({ key }) => measures[key] !== null
  ).map(({ key, label }) => ({ label, value: formatCm(measures[key]!) }));
  if (measures.weightG !== null) rows.push({ label: "Poids", value: formatWeight(measures.weightG) });
  return rows;
}

/** Compact size line for shop cards, e.g. "H 24 cm · Ø 12 cm" (no weight). */
export function sizeLine(measures: Measures): string {
  return DIMENSION_FIELDS.filter(({ key }) => measures[key] !== null)
    .map(({ key, short }) => `${short}${NBSP}${formatCm(measures[key]!)}`)
    .join(" · ");
}

/** "Vase Iga — n°2" → "vase-iga-n-2": accents stripped, URL-safe. */
export function slugify(title: string): string {
  return (
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "piece"
  );
}

/** Parses an admin form value ("24", "24,5", "", null) into a measure. */
export function parseMeasure(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 && n < 100000 ? Math.round(n * 10) / 10 : "invalid";
}
