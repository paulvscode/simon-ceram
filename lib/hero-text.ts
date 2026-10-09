// Homepage hero text (pure: shared by the admin editor and the homepage).

// Size of the hero phrase, chosen in the admin. The matching responsive
// classes live in components/Hero.tsx (Tailwind only scans app/ and
// components/ for class names).
export const HERO_SIZES = [
  { id: "xs", label: "Très petite" },
  { id: "s", label: "Petite" },
  { id: "m", label: "Moyenne" },
  { id: "l", label: "Grande" },
  { id: "xl", label: "Très grande" },
] as const;
export type HeroSize = (typeof HERO_SIZES)[number]["id"];
export const DEFAULT_HERO_SIZE: HeroSize = "s";

export type HeroText = {
  quote: string;
  signature: string;
  size: HeroSize;
};

export const DEFAULT_HERO_TEXT: HeroText = {
  quote:
    "La forme suit la lenteur. Chaque pièce naît d’un même geste, répété jusqu’à ce que la matière cesse de résister.",
  signature: "Simon — céramiste, atelier de grès et porcelaine",
  size: DEFAULT_HERO_SIZE,
};

export const HERO_LIMITS = { quote: 400, signature: 120 };

// Untrusted input → complete HeroText: trimmed, length-capped; an emptied
// quote falls back to the default so the hero never renders blank.
export function normalizeHeroText(input: unknown): HeroText {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  return {
    quote: text(raw.quote, HERO_LIMITS.quote) || DEFAULT_HERO_TEXT.quote,
    signature: text(raw.signature, HERO_LIMITS.signature),
    size: HERO_SIZES.some((s) => s.id === raw.size) ? (raw.size as HeroSize) : DEFAULT_HERO_SIZE,
  };
}
