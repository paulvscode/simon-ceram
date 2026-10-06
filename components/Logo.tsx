/**
 * Brand lockup: circular "SB" monogram (the wheel / the vessel's opening)
 * + serif wordmark + tracked descriptor. Exactly 40px tall (24px + 16px
 * lines) so it sits on the 8px baseline (claude.MD §1). The same monogram is
 * the favicon (app/icon.svg).
 */
export default function Logo() {
  return (
    <span className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-sm italic tracking-wide text-canvas"
      >
        SB
      </span>
      <span className="flex flex-col">
        <span className="font-serif text-xl leading-6 tracking-wide text-ink">Simon Barraud</span>
        <span className="font-sans text-[10px] uppercase leading-4 tracking-widest text-ink/50">
          Céramiste
        </span>
      </span>
    </span>
  );
}
