/**
 * Brand wordmark: "Simon BARRAUD" in the site serif — given name in regular
 * weight, family name in semi-bold small-tracked capitals (French Prénom NOM
 * convention) — over a tracked "Céramiste" descriptor. Exactly 40px tall
 * (24px + 16px lines) so it sits on the 8px baseline (claude.MD §1).
 */
export default function Logo() {
  return (
    <span className="flex flex-col">
      <span className="font-serif text-xl leading-6 text-ink">
        Simon <span className="font-semibold uppercase tracking-[0.08em]">Barraud</span>
      </span>
      <span className="font-sans text-[10px] uppercase leading-4 tracking-widest text-ink/50">
        Céramiste
      </span>
    </span>
  );
}
