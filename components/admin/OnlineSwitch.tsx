"use client";

// Classic on/off toggle for "En ligne / Hors ligne": a full-width row (the
// whole row is the tap target) with the state spelled out on the left and a
// sliding switch on the right. Track 64×32, knob 32 sliding 32 — all on the
// 8px grid; the knob's transparent 4px border lets the track show around it.
export default function OnlineSwitch({
  online,
  disabled = false,
  onChange,
}: {
  online: boolean;
  disabled?: boolean;
  onChange: (online: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={online}
      aria-label="Visible sur le site"
      disabled={disabled}
      onClick={() => onChange(!online)}
      className={`flex w-full items-center justify-between gap-4 rounded border px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        online ? "border-green-700/30 bg-green-50" : "border-ink/20 bg-white"
      }`}
    >
      <span className="flex flex-col">
        <span className={`text-sm font-semibold ${online ? "text-green-800" : "text-ink"}`}>
          {online ? "En ligne" : "Hors ligne"}
        </span>
        <span className="text-xs text-ink/60">
          {online ? "Visible sur le site" : "Masquée du site et de la boutique"}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-8 w-16 shrink-0 rounded-full transition-colors ${
          online ? "bg-green-700" : "bg-ink/20"
        }`}
      >
        <span
          className={`h-8 w-8 rounded-full border-4 border-transparent bg-white bg-clip-padding shadow transition-transform duration-200 ${
            online ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
