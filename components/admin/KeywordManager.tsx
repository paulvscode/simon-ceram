"use client";

import { useState } from "react";
import type { Keyword } from "@/lib/keywords";

const inputClass =
  "border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-base text-ink outline-none focus:border-ink";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";

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

  async function handleRenameSubmit(id: string) {
    if (!editingLabel.trim()) return;
    setBusyId(id);
    await onRename(id, editingLabel);
    setBusyId(null);
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    await onDelete(id);
    setBusyId(null);
  }

  return (
    <div>
      <h2 className={labelClass}>Mots-clés {loading ? "" : `(${keywords.length})`}</h2>

      <ul className="mt-8 flex flex-col gap-y-4">
        {keywords.map((keyword) => (
          <li key={keyword.id} className="flex items-center justify-between gap-4">
            {editingId === keyword.id ? (
              <input
                autoFocus
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onBlur={() => handleRenameSubmit(keyword.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(keyword.id)}
                className={`${inputClass} flex-1`}
              />
            ) : (
              <button
                onClick={() => {
                  setEditingId(keyword.id);
                  setEditingLabel(keyword.label);
                }}
                className="flex-1 text-left font-serif text-base hover:text-ink/70"
              >
                {keyword.label}
              </button>
            )}
            <button
              onClick={() => handleDelete(keyword.id)}
              disabled={busyId === keyword.id}
              className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink disabled:text-ink/20"
            >
              {busyId === keyword.id ? "…" : "Supprimer"}
            </button>
          </li>
        ))}
        {!loading && keywords.length === 0 ? (
          <li className={labelClass}>Aucun mot-clé pour le moment.</li>
        ) : null}
      </ul>

      <form onSubmit={handleCreate} className="mt-8 flex items-center gap-4">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nouveau mot-clé"
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={creating}
          className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
        >
          {creating ? "…" : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
