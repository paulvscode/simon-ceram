"use client";

import { useState } from "react";
import {
  DEFAULT_HOME_BACKGROUND,
  HOME_BACKGROUND_FILTERS,
  homeBackgroundFilter,
  type HomeBackground,
} from "@/lib/home-background";
import type { HeroSize } from "@/lib/hero-text";
import type { Product } from "@/lib/products";
import ImageUploadField from "./ImageUploadField";
import HomepagePreview, { type PreviewDevice } from "./HomepagePreview";
import { HERO_PANEL_CLASS } from "@/components/Hero";
import {
  cardClass,
  errorClass,
  hintClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

// The two opacities get their own card with the full homepage preview.
const OPACITY_KEYS = ["imageOpacity", "vitrineOpacity"] as const;
const isOpacity = (key: string) => (OPACITY_KEYS as readonly string[]).includes(key);

/**
 * Two cards sharing one set of values (and one saved document):
 * "Image de la page d'accueil" (photo + filters) and "Opacités" (image and
 * Vitrine opacity, with a live scrollable preview of the homepage). Either
 * card's save button stores everything, so they can't overwrite each other.
 */
export default function HomeBackgroundEditor({
  initialBackground,
  hero,
  vitrineProducts,
}: {
  initialBackground: HomeBackground;
  // The saved hero text, shown in the previews.
  hero: { quote: string; signature: string; size: HeroSize };
  // Online pieces currently in the Vitrine, for the homepage preview.
  vitrineProducts: Product[];
}) {
  const [device, setDevice] = useState<PreviewDevice>("desktop");
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

  const feedback = (
    <>
      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. La page d&rsquo;accueil est à jour.
        </p>
      ) : null}
    </>
  );

  const saveButton = (
    <button onClick={handleSave} disabled={saving || uploading || !dirty} className={primaryButtonClass}>
      {uploading ? "Téléversement en cours…" : saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
    </button>
  );

  const cancelButton = dirty ? (
    <button onClick={() => setBg(saved)} className={secondaryButtonClass}>
      Annuler les changements
    </button>
  ) : null;

  function slider(key: (typeof HOME_BACKGROUND_FILTERS)[number]) {
    const { label, hint, min, max } = key;
    return (
      <label key={key.key} className="block">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="text-sm tabular-nums text-ink">{bg[key.key]} %</span>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={bg[key.key]}
          onChange={(e) => update({ [key.key]: Number(e.target.value) })}
          className="mt-2 h-8 w-full cursor-pointer accent-ink"
        />
        <span className={`block ${hintClass}`}>{hint}</span>
      </label>
    );
  }

  return (
    <>
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Image de la page d&rsquo;accueil</h2>
      <p className={`mt-2 ${hintClass}`}>
        Réglez l&rsquo;image ci-dessous : l&rsquo;aperçu montre le résultat avec le texte
        d&rsquo;accueil. Les opacités se règlent dans la carte « Opacités ». Rien ne change sur le
        site avant d&rsquo;avoir enregistré.
      </p>

      {/* Live preview: same filter string and veil as components/HeroBackground. */}
      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded border border-ink/10 bg-canvas md:aspect-[16/10]">
        {bg.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg.imageUrl}
            alt="Aperçu de l’image d’accueil"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: homeBackgroundFilter(bg), opacity: bg.imageOpacity / 100 }}
          />
        ) : null}
        <div className="absolute inset-0 bg-canvas" style={{ opacity: bg.veil / 100 }} />
        <div className="relative p-4 md:p-8">
          <p className={`p-4 font-sans text-base italic leading-snug text-ink md:w-3/5 md:text-xl ${HERO_PANEL_CLASS}`}>
            {hero.quote}
          </p>
        </div>
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
        {HOME_BACKGROUND_FILTERS.filter((f) => !isOpacity(f.key)).map(slider)}
      </div>

      {feedback}
      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
        {saveButton}
        <button onClick={resetFilters} className={secondaryButtonClass}>
          Réglages d&rsquo;origine
        </button>
        {cancelButton}
      </div>
    </section>

    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Opacités</h2>
      <p className={`mt-2 ${hintClass}`}>
        L&rsquo;opacité de l&rsquo;image d&rsquo;accueil et du fond de la Vitrine. L&rsquo;aperçu
        ci-dessous montre la page d&rsquo;accueil en direct : faites-le défiler (ou touchez
        « Vitrine ») pour voir les pièces passer sur l&rsquo;image.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {HOME_BACKGROUND_FILTERS.filter((f) => isOpacity(f.key)).map(slider)}
      </div>

      <div className="mt-8 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">Aperçu en direct</p>
        <div role="radiogroup" aria-label="Appareil de l’aperçu" className="flex gap-2">
          {(["desktop", "phone"] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={device === d}
              onClick={() => setDevice(d)}
              className={`rounded border px-4 py-2 text-sm font-medium transition-colors ${
                device === d ? "border-ink bg-ink text-canvas" : "border-ink/20 text-ink hover:border-ink"
              }`}
            >
              {d === "desktop" ? "Ordinateur" : "Téléphone"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <HomepagePreview bg={bg} hero={hero} products={vitrineProducts} device={device} />
      </div>

      {feedback}
      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
        {saveButton}
        <button
          onClick={() => update({ imageOpacity: DEFAULT_HOME_BACKGROUND.imageOpacity, vitrineOpacity: DEFAULT_HOME_BACKGROUND.vitrineOpacity })}
          className={secondaryButtonClass}
        >
          Opacités d&rsquo;origine
        </button>
        {cancelButton}
      </div>
    </section>
    </>
  );
}
