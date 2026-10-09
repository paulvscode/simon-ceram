"use client";

import { useState } from "react";
import type { BlogPostMeta } from "@/lib/blog";
import { formatPostDate, postThumbnail, todayIso } from "@/lib/blog-format";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";
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

type Form = {
  title: string;
  date: string;
  tags: string; // as typed: "céramique, cuisson"
  excerpt: string;
  coverImageUrl: string;
  published: boolean;
  html: string;
};

const emptyForm = (): Form => ({
  title: "",
  date: todayIso(),
  tags: "",
  excerpt: "",
  coverImageUrl: "",
  published: false,
  html: "",
});

const splitTags = (tags: string) => [...new Set(tags.split(",").map((t) => t.trim()).filter(Boolean))];

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded px-2 text-xs font-medium ${
        published ? "bg-green-100 text-green-800" : "bg-ink/10 text-ink/60"
      }`}
    >
      {published ? "Publié" : "Brouillon"}
    </span>
  );
}

// Right-hand "Statut" column of the list: online or not, at a glance.
function StatusCell({ published }: { published: boolean }) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-end text-right">
      <span className={`flex items-center gap-2 text-sm font-semibold ${published ? "text-green-800" : "text-ink/60"}`}>
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${published ? "bg-green-600" : "bg-ink/30"}`} />
        {published ? "En ligne" : "Brouillon"}
      </span>
      <span className="text-xs text-ink/50">{published ? "Visible sur le site" : "Non visible"}</span>
    </div>
  );
}

function Miniature({ url }: { url: string }) {
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-ink/10">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

export default function BlogManager({ initialPosts }: { initialPosts: BlogPostMeta[] }) {
  const [posts, setPosts] = useState(initialPosts);
  // null: the list. Otherwise the editor, for a new post (id null) or an existing one.
  const [editing, setEditing] = useState<{ id: string | null; slug: string | null } | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [savedForm, setSavedForm] = useState<Form>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  // Remounts the rich text editor with the right content when switching posts.
  const [editorKey, setEditorKey] = useState(0);

  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }

  function openNew() {
    const blank = emptyForm();
    setForm(blank);
    setSavedForm(blank);
    setEditing({ id: null, slug: null });
    setError(null);
    setJustSaved(false);
    setEditorKey((k) => k + 1);
  }

  async function openExisting(meta: BlogPostMeta) {
    setEditing({ id: meta.id, slug: meta.slug });
    setError(null);
    setJustSaved(false);
    setLoading(true);
    const res = await fetch(`/api/blog/${meta.id}`);
    setLoading(false);
    if (!res.ok) {
      setError("Impossible de charger l’article. Réessayez.");
      return;
    }
    const { post } = await res.json();
    const loaded: Form = {
      title: post.title,
      date: post.date,
      tags: post.tags.join(", "),
      excerpt: post.excerpt,
      coverImageUrl: post.coverImageUrl,
      published: post.published,
      html: post.html,
    };
    setForm(loaded);
    setSavedForm(loaded);
    setEditorKey((k) => k + 1);
  }

  function backToList() {
    if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) return;
    setEditing(null);
  }

  // Saves the form; `published` is the status the post should end up with
  // (the Publier / brouillon buttons below).
  async function handleSave(published: boolean) {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(editing.id ? `/api/blog/${editing.id}` : "/api/blog", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, published, tags: splitTags(form.tags) }),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    const meta = body.post as BlogPostMeta;
    setPosts((prev) =>
      (prev.some((p) => p.id === meta.id) ? prev.map((p) => (p.id === meta.id ? meta : p)) : [...prev, meta]).sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
      )
    );
    setEditing({ id: meta.id, slug: meta.slug });
    const normalized = { ...form, published: meta.published, tags: meta.tags.join(", ") };
    setForm(normalized);
    setSavedForm(normalized);
    setJustSaved(true);
  }

  // From the list: flip Publié / Brouillon without opening the editor.
  async function togglePublished(meta: BlogPostMeta) {
    setToggling(meta.id);
    setError(null);
    const current = await fetch(`/api/blog/${meta.id}`);
    const post = current.ok ? (await current.json()).post : null;
    const res = post
      ? await fetch(`/api/blog/${meta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...post, published: !meta.published }),
        })
      : null;
    setToggling(null);
    if (!res?.ok) {
      setError("Le changement de statut a échoué. Réessayez.");
      return;
    }
    const updated = (await res.json()).post as BlogPostMeta;
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleDelete(meta: { id: string; title: string }) {
    if (!window.confirm(`Supprimer l’article « ${meta.title} » ? Cette action est définitive.`)) return;
    const res = await fetch(`/api/blog/${meta.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("La suppression a échoué. Réessayez.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== meta.id));
    setEditing(null);
  }

  // ---- List ----
  if (!editing) {
    return (
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className={sectionTitleClass}>Articles du blog</h2>
          <button onClick={openNew} className={primaryButtonClass}>
            + Nouvel article
          </button>
        </div>
        <p className={`mt-2 ${hintClass}`}>
          Les brouillons ne sont visibles que par vous (bouton « Aperçu »). Publiez un article pour
          qu&rsquo;il apparaisse sur la page Blog.
        </p>
        {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}

        {posts.length > 0 ? (
          <div className="mt-4 flex justify-between gap-4 border-b border-ink/10 pb-2 text-xs font-medium uppercase tracking-wide text-ink/50">
            <span>Article</span>
            <span className="w-32 text-right">Statut</span>
          </div>
        ) : null}
        <ul className="flex flex-col divide-y divide-ink/10">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-col gap-4 py-4">
              <div className="flex items-start gap-4">
                <Miniature url={postThumbnail(p, 160)} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-base font-semibold text-ink">{p.title}</p>
                  <p className={hintClass}>
                    {formatPostDate(p.date)}
                    {p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
                  </p>
                </div>
                <StatusCell published={p.published} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  onClick={() => togglePublished(p)}
                  disabled={toggling === p.id}
                  className={p.published ? secondaryButtonClass : primaryButtonClass}
                >
                  {toggling === p.id ? "…" : p.published ? "Dépublier" : "Publier"}
                </button>
                <button onClick={() => openExisting(p)} className={secondaryButtonClass}>
                  Modifier
                </button>
                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
                  {p.published ? "Voir ↗" : "Aperçu ↗"}
                </a>
                <button onClick={() => handleDelete(p)} className={dangerButtonClass}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
          {posts.length === 0 ? <li className={`py-4 ${hintClass}`}>Aucun article pour le moment.</li> : null}
        </ul>
      </section>
    );
  }

  // ---- Editor ----
  const tags = splitTags(form.tags);
  const busy = saving || uploading || !form.title.trim();
  return (
    <section className={cardClass}>
      <button onClick={backToList} className="text-sm text-ink underline underline-offset-4 hover:text-ink/70">
        ← Retour aux articles
      </button>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h2 className={sectionTitleClass}>{editing.id ? "Modifier l’article" : "Nouvel article"}</h2>
        {editing.id ? <StatusBadge published={savedForm.published} /> : null}
      </div>

      {loading ? (
        <p className={`mt-4 ${hintClass}`}>Chargement…</p>
      ) : (
        <>
          <label className={`mt-4 ${labelClass}`}>
            Titre *
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="Une semaine de cuisson à l’anagama"
            />
          </label>

          <label className={`mt-4 block sm:w-1/2 ${labelClass}`}>
            Date de publication
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </label>

          <label className={`mt-4 ${labelClass}`}>
            Mots-clés
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={`mt-2 ${inputClass}`}
              placeholder="cuisson, grès, atelier"
            />
          </label>
          <p className={`mt-2 ${hintClass}`}>Séparés par des virgules. Ils servent de filtres sur la page Blog.</p>
          {tags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="rounded bg-ink/10 px-2 text-xs font-medium leading-6 text-ink/70">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <label className={`mt-4 ${labelClass}`}>
            Extrait (facultatif)
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={2}
              maxLength={400}
              className={`mt-2 ${inputClass} resize-y`}
            />
          </label>
          <p className={`mt-2 ${hintClass}`}>
            Résumé affiché dans la liste des articles. Laissé vide : les premières lignes de l&rsquo;article.
          </p>

          <ImageUploadField
            folder="blog-images"
            label="Miniature"
            hint="Petite image carrée affichée dans la liste du blog (recadrée automatiquement) et lors des partages. Sans miniature, la première image de l’article est utilisée."
            value={form.coverImageUrl}
            onChange={(v) => set("coverImageUrl", v)}
            onUploadingChange={setUploading}
          />

          <p className={`mt-8 ${labelClass}`}>Contenu</p>
          <p className={`mt-2 ${hintClass}`}>
            Titres, listes, citations, liens et images (bouton « Image »). Touchez une image pour
            choisir sa taille : petite, moyenne ou grande.
          </p>
          <div className="mt-2">
            <RichTextEditor
              key={editorKey}
              initialHtml={form.html}
              onChange={(html) => set("html", html)}
              imageFolder="blog-images"
              ariaLabel="Contenu de l’article"
            />
          </div>

          {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
          {justSaved ? (
            <p role="status" className="mt-4 text-sm text-green-800">
              Enregistré.{" "}
              {form.published ? "L’article est en ligne." : "C’est un brouillon : il n’est pas visible sur le site."}
            </p>
          ) : null}

          <div className="mt-8 grid grid-cols-1 gap-2 sm:flex">
            {savedForm.published && editing.id ? (
              <>
                <button
                  onClick={() => handleSave(true)}
                  disabled={busy || !dirty}
                  className={primaryButtonClass}
                >
                  {uploading ? "Téléversement en cours…" : saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
                </button>
                <button onClick={() => handleSave(false)} disabled={busy} className={secondaryButtonClass}>
                  Repasser en brouillon
                </button>
              </>
            ) : (
              <>
                <button onClick={() => handleSave(true)} disabled={busy} className={primaryButtonClass}>
                  {uploading ? "Téléversement en cours…" : saving ? "Enregistrement…" : "Publier"}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={busy || (!dirty && !!editing.id)}
                  className={secondaryButtonClass}
                >
                  Enregistrer le brouillon
                </button>
              </>
            )}
            {editing.slug ? (
              <a href={`/blog/${editing.slug}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
                {savedForm.published ? "Voir l’article ↗" : "Aperçu ↗"}
              </a>
            ) : null}
            {editing.id ? (
              <button onClick={() => handleDelete({ id: editing.id!, title: form.title })} className={dangerButtonClass}>
                Supprimer
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
