// "Vitrine": the permanent keyword behind the homepage's Vitrine section and
// the admin's "Page d'accueil" toggle; also a regular filter in the shop.
// It always exists (see withVitrine in lib/keywords.ts) and can't be renamed
// or deleted. "Selected Works" — its former name — is recognised as the same
// keyword, and keeps its id, so pieces tagged before the rename stay tagged.
export const VITRINE_LABEL = "Vitrine";
// Used only when no stored keyword matches yet.
export const VITRINE_DEFAULT_ID = "vitrine";
const RECOGNISED_LABELS = ["vitrine", "selected works"];

export function isVitrine(keyword: { label: string }): boolean {
  return RECOGNISED_LABELS.includes(keyword.label.trim().toLowerCase());
}
