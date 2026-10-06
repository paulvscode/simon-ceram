// Shared admin styles: plain, legible, app-like. Spacing still sits on the
// 8px baseline (claude.MD §1); only the typography departs from the showcase.
export const cardClass = "rounded border border-ink/10 bg-white p-4 md:p-6";
export const sectionTitleClass = "text-lg font-semibold text-ink";
export const labelClass = "block text-sm font-medium text-ink";
export const hintClass = "text-sm text-ink/60";
export const inputClass =
  "w-full rounded border border-ink/20 bg-white px-2 py-2 text-base text-ink outline-none placeholder:text-ink/40 focus:border-ink";
// Phones: 24px box in a 40px-tall row so it's an easy thumb target.
export const checkboxLabelClass =
  "flex cursor-pointer items-center gap-2 py-2 text-base text-ink md:py-0 md:text-sm";
export const checkboxClass = "h-6 w-6 shrink-0 cursor-pointer accent-ink md:h-4 md:w-4";

const buttonBase =
  "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
export const primaryButtonClass = `${buttonBase} bg-ink text-canvas hover:bg-ink/80`;
export const secondaryButtonClass = `${buttonBase} border border-ink/20 text-ink hover:border-ink`;
export const dangerButtonClass = `${buttonBase} border border-red-700/30 text-red-700 hover:border-red-700 hover:bg-red-50`;
export const errorClass = "text-sm text-red-700";
