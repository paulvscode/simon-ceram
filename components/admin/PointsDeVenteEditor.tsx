"use client";

import { useState } from "react";
import {
  EMPTY_POINT_DE_VENTE,
  MAX_POINTS_DE_VENTE,
  type PointDeVente,
} from "@/lib/points-de-vente";
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

// Plain text inputs: links may be typed without "https://" (the server adds it),
// which a type="url" field would reject; "url" only picks the URL keypad.
const FIELDS: { key: keyof PointDeVente; label: string; placeholder: string; type?: "url" }[] = [
  { key: "name", label: "Nom de la boutique *", placeholder: "Galerie du Grès" },
  { key: "address", label: "Adresse", placeholder: "4 place de l’Église" },
  { key: "city", label: "Ville", placeholder: "Dieulefit" },
  { key: "url", label: "Site ou Instagram", placeholder: "instagram.com/galeriedugres", type: "url" },
  { key: "note", label: "Note (horaires, pièces disponibles…)", placeholder: "Du mardi au samedi, 10h–18h" },
];

export default function PointsDeVenteEditor({ initialList }: { initialList: PointDeVente[] }) {
  const [saved, setSaved] = useState(initialList);
  const [list, setList] = useState(initialList);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(list) !== JSON.stringify(saved);
  const unnamed = list.some((p) => !p.name.trim());

  function update(next: PointDeVente[]) {
    setList(next);
    setJustSaved(false);
  }

  function edit(index: number, patch: Partial<PointDeVente>) {
    update(list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...list];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update(next);
  }

  function remove(index: number) {
    const p = list[index];
    if (p.name.trim() && !window.confirm(`Retirer « ${p.name} » des points de vente ?`)) return;
    update(list.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/site/points-de-vente", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    // The server completes links (https://…) and trims; show what's live.
    const { pointsDeVente } = (await res.json()) as { pointsDeVente: PointDeVente[] };
    setList(pointsDeVente);
    setSaved(pointsDeVente);
    setJustSaved(true);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Points de vente</h2>
      <p className={`mt-2 ${hintClass}`}>
        Les boutiques où l&rsquo;on trouve vos pièces, affichées sur la page « Points de vente »
        du site, dans cet ordre.
      </p>

      <ol className="mt-4 flex flex-col gap-4">
        {list.map((p, index) => (
          <li key={index} className="rounded border border-ink/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink/60">
                {p.name.trim() || `Boutique ${index + 1}`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Monter ${p.name || `la boutique ${index + 1}`}`}
                  className={secondaryButtonClass}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === list.length - 1}
                  aria-label={`Descendre ${p.name || `la boutique ${index + 1}`}`}
                  className={secondaryButtonClass}
                >
                  ↓
                </button>
                <button type="button" onClick={() => remove(index)} className={dangerButtonClass}>
                  Supprimer
                </button>
              </div>
            </div>
            {FIELDS.map(({ key, label, placeholder, type }) => (
              <label key={key} className={`mt-4 ${labelClass}`}>
                {label}
                <input
                  type="text"
                  inputMode={type === "url" ? "url" : undefined}
                  value={p[key]}
                  onChange={(e) => edit(index, { [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
            ))}
          </li>
        ))}
        {list.length === 0 ? (
          <li className={hintClass}>Aucun point de vente pour le moment.</li>
        ) : null}
      </ol>

      {list.length < MAX_POINTS_DE_VENTE ? (
        <button
          type="button"
          onClick={() => update([...list, { ...EMPTY_POINT_DE_VENTE }])}
          className={`mt-4 w-full ${secondaryButtonClass}`}
        >
          + Ajouter un point de vente
        </button>
      ) : null}

      {unnamed ? <p className={`mt-4 ${hintClass}`}>Chaque boutique doit avoir un nom pour être enregistrée.</p> : null}
      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. La page Points de vente est à jour.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
        <button onClick={handleSave} disabled={saving || !dirty || unnamed} className={primaryButtonClass}>
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
        </button>
        {dirty ? (
          <button onClick={() => update(saved)} className={secondaryButtonClass}>
            Annuler les changements
          </button>
        ) : null}
        <a href="/points-de-vente" target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          Voir sur le site ↗
        </a>
      </div>
    </section>
  );
}
