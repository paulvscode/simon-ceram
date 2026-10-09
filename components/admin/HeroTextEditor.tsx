"use client";

import { useState } from "react";
import { DEFAULT_HERO_TEXT, HERO_LIMITS, type HeroText } from "@/lib/hero-text";
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

  const dirty = hero.quote !== saved.quote || hero.signature !== saved.signature;

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
