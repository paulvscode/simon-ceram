"use client";

import { useState } from "react";
import { DEFAULT_HERO_TEXT, HERO_LIMITS, HERO_SIZES, type HeroText } from "@/lib/hero-text";
import { HERO_PANEL_CLASS, HERO_SIZE_CLASSES } from "@/components/Hero";
import {
  cardClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

export default function HeroTextEditor({ initialHero }: { initialHero: HeroText }) {
  const [saved, setSaved] = useState(initialHero);
  const [hero, setHero] = useState(initialHero);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty =
    hero.quote !== saved.quote || hero.signature !== saved.signature || hero.size !== saved.size;

  function update(patch: Partial<HeroText>) {
    setHero((prev) => ({ ...prev, ...patch }));
    setJustSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/site/hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hero),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    const { hero: stored } = (await res.json()) as { hero: HeroText };
    setHero(stored);
    setSaved(stored);
    setJustSaved(true);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Texte d&rsquo;accueil</h2>
      <p className={`mt-2 ${hintClass}`}>
        La grande phrase affichée en haut de la page d&rsquo;accueil, sur l&rsquo;image.
      </p>

      <label className={`mt-4 ${labelClass}`}>
        Phrase d&rsquo;accueil
        <textarea
          value={hero.quote}
          onChange={(e) => update({ quote: e.target.value })}
          maxLength={HERO_LIMITS.quote}
          rows={4}
          className={`mt-2 ${inputClass} resize-y font-sans italic`}
        />
      </label>
      <p className={`mt-2 ${hintClass}`}>
        {hero.quote.length}/{HERO_LIMITS.quote} caractères — une ou deux phrases courtes rendent le mieux.
      </p>

      <label className={`mt-4 ${labelClass}`}>
        Signature (petite ligne sous la phrase, facultative)
        <input
          value={hero.signature}
          onChange={(e) => update({ signature: e.target.value })}
          maxLength={HERO_LIMITS.signature}
          className={`mt-2 ${inputClass}`}
          placeholder={DEFAULT_HERO_TEXT.signature}
        />
      </label>

      <fieldset className="mt-4">
        <legend className={labelClass}>Taille du texte</legend>
        <div role="radiogroup" aria-label="Taille du texte" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {HERO_SIZES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={hero.size === id}
              onClick={() => update({ size: id })}
              className={`rounded border px-2 py-2 text-sm font-medium transition-colors ${
                hero.size === id ? "border-ink bg-ink text-canvas" : "border-ink/20 text-ink hover:border-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={`mt-2 ${hintClass}`}>
          Le texte s&rsquo;adapte à l&rsquo;écran : plus petit sur téléphone, plus grand sur ordinateur.
        </p>
      </fieldset>

      {/* Preview at the phone size of the chosen setting, on the site's panel. */}
      <div className="mt-4 rounded border border-ink/10 bg-ink/20 p-4">
        <p className={`${hintClass} text-ink/70`}>Aperçu (taille téléphone)</p>
        <div className={`mt-2 p-4 ${HERO_PANEL_CLASS}`}>
          <p className={`whitespace-pre-line font-sans italic leading-snug text-ink ${HERO_SIZE_CLASSES[hero.size].split(" ")[0]}`}>
            {hero.quote}
          </p>
        </div>
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. La page d&rsquo;accueil est à jour.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
        <button onClick={handleSave} disabled={saving || !dirty || !hero.quote.trim()} className={primaryButtonClass}>
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
        </button>
        {dirty ? (
          <button onClick={() => setHero(saved)} className={secondaryButtonClass}>
            Annuler les changements
          </button>
        ) : null}
        <button
          onClick={() => update(DEFAULT_HERO_TEXT)}
          className={secondaryButtonClass}
        >
          Texte d&rsquo;origine
        </button>
      </div>
    </section>
  );
}
