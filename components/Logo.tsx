/**
 * Brand wordmark: "Simon BARRAUD DE LAGERIE" in the site serif — given name in regular
 * weight, family name in semi-bold small-tracked capitals (French Prénom NOM
 * convention) — over a tracked "Céramiste" descriptor. 40px tall (24px +
 * 16px lines) so it sits on the 8px baseline (claude.MD §1); 64px on phones
 * narrower than 360px, where the family name takes its own line.
 */
export default function Logo() {
  return (
    <span className="flex flex-col">
      {/* One line: 15px on phones (the full name is ~237px; a 360px phone
          has ~250px beside the cart badge and menu button), 20px from `sm`.
          Below 360px the family name drops cleanly onto its own line. */}
      <span className="whitespace-nowrap font-sans text-[15px] leading-6 text-ink sm:text-xl sm:leading-6">
        Simon{" "}
        <span className="font-semibold uppercase tracking-[0.08em] max-[359px]:block">
          Barraud de Lagerie
        </span>
      </span>
      <span className="font-sans text-[10px] uppercase leading-4 tracking-widest text-ink/50">
        Céramiste
      </span>
    </span>
  );
}
