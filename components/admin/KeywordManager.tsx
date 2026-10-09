"use client";

import { useState } from "react";
import type { Keyword } from "@/lib/keywords";
import { isVitrine } from "@/lib/vitrine";
import {
  cardClass,
  dangerButtonClass,
  hintClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

export default function KeywordManager({
  keywords,
  loading,
  onCreate,
  onRename,
  onDelete,
}: {
  keywords: Keyword[];
  loading: boolean;
  onCreate: (label: string) => Promise<void>;
  onRename: (id: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    await onCreate(newLabel);
    setCreating(false);
    setNewLabel("");
  }

  async function handleRenameSubmit(event: React.FormEvent, id: string) {
    event.preventDefault();
    if (!editingLabel.trim()) return;
    setBusyId(id);
    await onRename(id, editingLabel);
    setBusyId(null);
    setEditingId(null);
  }

  async function handleDelete(keyword: Keyword) {
    if (!window.confirm(`Supprimer le mot-clé « ${keyword.label} » ? Il sera retiré de toutes les pièces.`)) return;
    setBusyId(keyword.id);
    await onDelete(keyword.id);
    setBusyId(null);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Mots-clés</h2>
      <p className={`mt-2 ${hintClass}`}>
        Servent de filtres sur la page Shop. « Vitrine » est permanent : il place une pièce sur
        la page Vitrine, via le bouton « Vitrine » de chaque pièce.
      </p>

      <ul className="mt-4 flex flex-col divide-y divide-ink/10">
        {keywords.map((keyword) => (
          <li key={keyword.id} className="py-4 sm:py-2">
            {isVitrine(keyword) ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 break-words text-base text-ink">{keyword.label}</span>
                <span className="rounded bg-ink/10 px-2 text-xs font-medium leading-6 text-ink/70">
                  Permanent
                </span>
              </div>
            ) : editingId === keyword.id ? (
              <form
                onSubmit={(e) => handleRenameSubmit(e, keyword.id)}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  autoFocus
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busyId === keyword.id}
                    className={`flex-1 sm:flex-none ${primaryButtonClass}`}
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className={`flex-1 sm:flex-none ${secondaryButtonClass}`}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="flex-1 break-words text-base text-ink">{keyword.label}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(keyword.id);
                      setEditingLabel(keyword.label);
                    }}
                    disabled={busyId === keyword.id}
                    className={`flex-1 sm:flex-none ${secondaryButtonClass}`}
                  >
                    Renommer
                  </button>
                  <button
                    onClick={() => handleDelete(keyword)}
                    disabled={busyId === keyword.id}
                    className={`flex-1 sm:flex-none ${dangerButtonClass}`}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {loading ? <li className={`py-2 ${hintClass}`}>Chargement…</li> : null}
        {!loading && keywords.length === 0 ? (
          <li className={`py-2 ${hintClass}`}>Aucun mot-clé pour le moment.</li>
        ) : null}
      </ul>

      <form onSubmit={handleCreate} className="mt-4 flex items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nouveau mot-clé"
          className={`${inputClass} flex-1`}
        />
        <button type="submit" disabled={creating || !newLabel.trim()} className={primaryButtonClass}>
          {creating ? "Ajout…" : "Ajouter"}
        </button>
      </form>
    </section>
  );
}
