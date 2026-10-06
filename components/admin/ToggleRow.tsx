"use client";

// Classic on/off toggle as a full-width row (the whole row is the tap
// target): state spelled out on the left, sliding switch on the right.
// Track 64×32, knob 32 sliding 32 — all on the 8px grid; the knob's
// transparent 4px border lets the track show around it.
const TONES = {
  green: { row: "border-green-700/30 bg-green-50", title: "text-green-800", track: "bg-green-700" },
  ink: { row: "border-ink/40 bg-ink/[0.04]", title: "text-ink", track: "bg-ink" },
};

export default function ToggleRow({
  checked,
  onChange,
  label,
  onTitle,
  offTitle,
  onHint,
  offHint,
  tone = "green",
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // Accessible name of the switch, e.g. "Visible sur le site".
  label: string;
  onTitle: string;
  offTitle: string;
  onHint: string;
  offHint: string;
  tone?: keyof typeof TONES;
  disabled?: boolean;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded border px-4 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? t.row : "border-ink/20 bg-white"
      }`}
    >
      <span className="flex flex-col">
        <span className={`text-sm font-semibold ${checked ? t.title : "text-ink"}`}>
          {checked ? onTitle : offTitle}
        </span>
        <span className="text-xs text-ink/60">{checked ? onHint : offHint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-8 w-16 shrink-0 rounded-full transition-colors ${
          checked ? t.track : "bg-ink/20"
        }`}
      >
        <span
          className={`h-8 w-8 rounded-full border-4 border-transparent bg-white bg-clip-padding shadow transition-transform duration-200 ${
            checked ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

/** "En ligne / Hors ligne": used on each piece's card and in the form. */
export function OnlineToggle(props: { online: boolean; onChange: (online: boolean) => void; disabled?: boolean }) {
  return (
    <ToggleRow
      checked={props.online}
      onChange={props.onChange}
      disabled={props.disabled}
      label="Visible sur le site"
      onTitle="En ligne"
      offTitle="Hors ligne"
      onHint="Visible sur le site"
      offHint="Masquée du site et de la boutique"
    />
  );
}
