"use client";

import { useState } from "react";
import {
  DEFAULT_PROCESS_SECTION,
  MAX_PROCESS_STEPS,
  type ProcessSection,
  type ProcessStep,
} from "@/lib/process-section";
import ImageUploadField from "./ImageUploadField";
import {
  cardClass,
  dangerButtonClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

export default function ProcessSectionEditor({ initialSection }: { initialSection: ProcessSection }) {
  const [saved, setSaved] = useState(initialSection);
  const [section, setSection] = useState(initialSection);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(section) !== JSON.stringify(saved);

  function update(patch: Partial<ProcessSection>) {
    setSection((prev) => ({ ...prev, ...patch }));
    setJustSaved(false);
  }

  function updateStep(index: number, patch: Partial<ProcessStep>) {
    update({ steps: section.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  function moveStep(index: number, direction: -1 | 1) {
    const steps = [...section.steps];
    [steps[index], steps[index + direction]] = [steps[index + direction], steps[index]];
    update({ steps });
  }

  function removeStep(index: number) {
    const step = section.steps[index];
    if ((step.title || step.text) && !window.confirm(`Supprimer l’étape « ${step.title || index + 1} » ?`)) {
      return;
    }
    update({ steps: section.steps.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/site/process", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    // The server drops empty steps and trims text; show exactly what's live.
    const { section: stored } = (await res.json()) as { section: ProcessSection };
    setSection(stored);
    setSaved(stored);
    setJustSaved(true);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Section « processus » de l&rsquo;accueil</h2>
      <p className={`mt-2 ${hintClass}`}>
        Affichée sur la page d&rsquo;accueil, sous le bouton vers la boutique. Racontez les
        étapes de votre travail : enfournement, allumage, cuisson…
      </p>

      <label className={`mt-4 ${labelClass}`}>
        Surtitre
        <input
          value={section.label}
          onChange={(e) => update({ label: e.target.value })}
          className={`mt-2 ${inputClass}`}
          placeholder="Le processus"
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Titre
        <textarea
          value={section.title}
          onChange={(e) => update({ title: e.target.value })}
          rows={2}
          className={`mt-2 ${inputClass} resize-y`}
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Introduction
        <textarea
          value={section.intro}
          onChange={(e) => update({ intro: e.target.value })}
          rows={4}
          className={`mt-2 ${inputClass} resize-y`}
        />
      </label>

      <ImageUploadField
        folder="site-images"
        label="Grande image (facultative)"
        hint="Affichée sur toute la largeur de l’écran, entre l’introduction et les étapes."
        value={section.imageUrl}
        onChange={(imageUrl) => update({ imageUrl })}
        onUploadingChange={setUploading}
      />
      {section.imageUrl ? (
        <label className={`mt-4 ${labelClass}`}>
          Description de l&rsquo;image
          <input
            value={section.imageAlt}
            onChange={(e) => update({ imageAlt: e.target.value })}
            className={`mt-2 ${inputClass}`}
            placeholder="Le four à bois pendant la cuisson"
          />
          <span className={`mt-2 block font-normal ${hintClass}`}>
            Lue par les lecteurs d&rsquo;écran et les moteurs de recherche.
          </span>
        </label>
      ) : null}

      <h3 className="mt-8 text-base font-semibold text-ink">
        Étapes ({section.steps.length}/{MAX_PROCESS_STEPS})
      </h3>
      <ol className="mt-4 flex flex-col gap-4">
        {section.steps.map((step, index) => (
          <li key={index} className="rounded border border-ink/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink/60">
                Étape {String(index + 1).padStart(2, "0")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveStep(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter l’étape ${index + 1}`}
                  className={secondaryButtonClass}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, 1)}
                  disabled={index === section.steps.length - 1}
                  aria-label={`Descendre l’étape ${index + 1}`}
                  className={secondaryButtonClass}
                >
                  ↓
                </button>
                <button type="button" onClick={() => removeStep(index)} className={dangerButtonClass}>
                  Supprimer
                </button>
              </div>
            </div>
            <label className={`mt-4 ${labelClass}`}>
              Titre de l&rsquo;étape
              <input
                value={step.title}
                onChange={(e) => updateStep(index, { title: e.target.value })}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className={`mt-4 ${labelClass}`}>
              Texte
              <textarea
                value={step.text}
                onChange={(e) => updateStep(index, { text: e.target.value })}
                rows={3}
                className={`mt-2 ${inputClass} resize-y`}
              />
            </label>
          </li>
        ))}
      </ol>
      {section.steps.length < MAX_PROCESS_STEPS ? (
        <button
          type="button"
          onClick={() => update({ steps: [...section.steps, { title: "", text: "" }] })}
          className={`mt-4 w-full ${secondaryButtonClass}`}
        >
          + Ajouter une étape
        </button>
      ) : null}

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
        {dirty ? (
          <button onClick={() => setSection(saved)} className={secondaryButtonClass}>
            Annuler les changements
          </button>
        ) : null}
        <button
          onClick={() => {
            if (window.confirm("Remplacer tout le contenu par le texte d’exemple ?")) {
              update(DEFAULT_PROCESS_SECTION);
            }
          }}
          className={secondaryButtonClass}
        >
          Texte d&rsquo;exemple
        </button>
        <a href="/#processus" target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          Voir sur le site ↗
        </a>
      </div>
    </section>
  );
}
