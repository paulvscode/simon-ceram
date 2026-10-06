"use client";

// "En ligne | Hors ligne" segmented switch: both states always visible, so
// the current one is obvious at a glance and one tap flips it.
export default function OnlineSwitch({
  online,
  disabled = false,
  onChange,
}: {
  online: boolean;
  disabled?: boolean;
  onChange: (online: boolean) => void;
}) {
  const option = (value: boolean, label: string, activeClass: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={online === value}
      disabled={disabled}
      onClick={() => online !== value && onChange(value)}
      className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed sm:flex-none ${
        online === value ? activeClass : "text-ink/60 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      role="radiogroup"
      aria-label="Visibilité sur le site"
      className="flex w-full gap-2 rounded border border-ink/20 bg-white p-2 sm:inline-flex sm:w-auto"
    >
      {option(true, "En ligne", "bg-green-700 text-white")}
      {option(false, "Hors ligne", "bg-ink text-canvas")}
    </div>
  );
}
