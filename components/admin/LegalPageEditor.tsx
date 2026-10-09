"use client";

import { useState } from "react";
import type { LegalPage } from "@/lib/site-content";
import { LEGAL_TEMPLATE_HTML } from "@/lib/legal-template";
import RichTextEditor from "./RichTextEditor";
import {
  cardClass,
  errorClass,
  hintClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

// Rich-text page edited in the admin: Mentions légales (default) or CGV.
export default function LegalPageEditor({
  initialPage,
  title = "Mentions légales",
  apiPath = "/api/site/legal",
  publicPath = "/mentions-legales",
  template = LEGAL_TEMPLATE_HTML,
  intro,
}: {
  initialPage: LegalPage;
  title?: string;
  apiPath?: string;
  publicPath?: string;
  template?: string;
  intro?: string;
}) {
  const [savedHtml, setSavedHtml] = useState(initialPage.html);
  const [html, setHtml] = useState(
    initialPage.updatedAt === null ? template : initialPage.html
  );
  const [updatedAt, setUpdatedAt] = useState(initialPage.updatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Never saved: the pre-filled template itself is worth saving.
  const dirty = updatedAt === null || html !== savedHtml;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setJustSaved(false);
    const res = await fetch(apiPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    const { page } = (await res.json()) as { page: LegalPage };
    setSavedHtml(html);
    setUpdatedAt(page.updatedAt);
    setJustSaved(true);
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>{title}</h2>
      {intro ? <p className={`mt-2 ${hintClass}`}>{intro}</p> : null}
      <p className={`mt-2 ${hintClass}`}>
        {updatedAt === null
          ? "Un modèle a été pré-rempli : complétez les passages [À compléter], puis enregistrez. La page reste vide sur le site tant qu’elle n’a pas été enregistrée."
          : `Dernière mise à jour : ${new Date(updatedAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}.`}
      </p>

      <div className="mt-4">
        <RichTextEditor
          initialHtml={html}
          onChange={(next) => {
            setHtml(next);
            setJustSaved(false);
          }}
        />
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. La page est à jour sur le site.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:flex">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={primaryButtonClass}
        >
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
        </button>
        <a href={publicPath} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
          Voir la page ↗
        </a>
      </div>
    </section>
  );
}
