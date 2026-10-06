"use client";

import { useState } from "react";
import {
  DEFAULT_HOME_BACKGROUND,
  HOME_BACKGROUND_FILTERS,
  homeBackgroundFilter,
  type HomeBackground,
} from "@/lib/home-background";
import ImageUploadField from "./ImageUploadField";
import {
  cardClass,
  errorClass,
  hintClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

export default function HomeBackgroundEditor({
  initialBackground,
  quote,
}: {
  initialBackground: HomeBackground;
  // The saved hero text, shown over the preview.
  quote: string;
}) {
  const [saved, setSaved] = useState(initialBackground);
  const [bg, setBg] = useState(initialBackground);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(bg) !== JSON.stringify(saved);

  function update(patch: Partial<HomeBackground>) {
    setBg((prev) => ({ ...prev, ...patch }));
    setJustSaved(false);
  }

  function resetFilters() {
    update({ ...DEFAULT_HOME_BACKGROUND, imageUrl: bg.imageUrl });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/site/home-background", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bg),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    const { background } = (await res.json()) as { background: HomeBackground };
    setBg(background);
    setSaved(background);
    setJustSaved(true);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Image de la page d&rsquo;accueil</h2>
      <p className={`mt-2 ${hintClass}`}>
        Réglez l&rsquo;image ci-dessous : l&rsquo;aperçu montre le résultat avec le texte
        d&rsquo;accueil. Rien ne change sur le site avant d&rsquo;avoir enregistré.
      </p>

      {/* Live preview: same filter string and veil as components/HeroBackground. */}
      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded border border-ink/10 bg-ink/5 md:aspect-[16/10]">
        {bg.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg.imageUrl}
            alt="Aperçu de l’image d’accueil"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: homeBackgroundFilter(bg) }}
          />
        ) : null}
        <div className="absolute inset-0 bg-canvas" style={{ opacity: bg.veil / 100 }} />
        <p className="relative p-4 font-serif text-xl italic leading-snug text-ink md:p-8 md:text-3xl">
          {quote}
        </p>
      </div>

      <ImageUploadField
        folder="site-images"
        label="Image"
        hint="Une photo en format paysage rend mieux sur ordinateur ; elle est recadrée automatiquement sur téléphone."
        value={bg.imageUrl}
        onChange={(imageUrl) => update({ imageUrl: imageUrl || DEFAULT_HOME_BACKGROUND.imageUrl })}
        onUploadingChange={setUploading}
      />

      <div className="mt-8 flex flex-col gap-4">
        {HOME_BACKGROUND_FILTERS.map(({ key, label, hint, min, max }) => (
          <label key={key} className="block">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink">{label}</span>
              <span className="text-sm tabular-nums text-ink">{bg[key]} %</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={bg[key]}
              onChange={(e) => update({ [key]: Number(e.target.value) })}
              className="mt-2 h-8 w-full cursor-pointer accent-ink"
            />
            <span className={`block ${hintClass}`}>{hint}</span>
          </label>
        ))}
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. La page d&rsquo;accueil est à jour.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
        <button
          onClick={handleSave}
          disabled={saving || uploading || !dirty}
          className={primaryButtonClass}
        >
          {uploading
            ? "Téléversement en cours…"
            : saving
              ? "Enregistrement…"
              : dirty
                ? "Enregistrer"
                : "Aucune modification"}
        </button>
        <button onClick={resetFilters} className={secondaryButtonClass}>
          Réglages d&rsquo;origine
        </button>
        {dirty ? (
          <button onClick={() => setBg(saved)} className={secondaryButtonClass}>
            Annuler les changements
          </button>
        ) : null}
      </div>
    </section>
  );
}
