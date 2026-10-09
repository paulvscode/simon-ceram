"use client";

import { useState } from "react";
import type { BlogPostMeta } from "@/lib/blog";
import { formatPostDate, postThumbnail, todayIso } from "@/lib/blog-format";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";
import ToggleRow from "./ToggleRow";
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

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const res = await fetch(editing.id ? `/api/blog/${editing.id}` : "/api/blog", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: splitTags(form.tags) }),
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
    const normalized = { ...form, tags: meta.tags.join(", "), excerpt: form.excerpt };
    setForm(normalized);
    setSavedForm(normalized);
    setJustSaved(true);
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

        <ul className="mt-4 flex flex-col divide-y divide-ink/10">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <Miniature url={postThumbnail(p, 160)} />
                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-base font-semibold text-ink">{p.title}</p>
                  <StatusBadge published={p.published} />
                </div>
                <p className={hintClass}>
                  {formatPostDate(p.date)}
                  {p.tags.length ? ` · ${p.tags.join(", ")}` : ""}
                </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => openExisting(p)} className={`flex-1 sm:flex-none ${secondaryButtonClass}`}>
                  Modifier
                </button>
                <a
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex-1 sm:flex-none ${secondaryButtonClass}`}
                >
                  {p.published ? "Voir ↗" : "Aperçu ↗"}
                </a>
                <button onClick={() => handleDelete(p)} className={`flex-1 sm:flex-none ${dangerButtonClass}`}>
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

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Date de publication
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <div>
              <p className={labelClass}>Statut</p>
              <div className="mt-2">
                <ToggleRow
                  checked={form.published}
                  onChange={(published) => set("published", published)}
                  label="Publié sur le site"
                  onTitle="Publié"
                  offTitle="Brouillon"
                  onHint="Visible sur la page Blog"
                  offHint="Visible seulement par vous"
                />
              </div>
            </div>
          </div>

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
            <button
              onClick={handleSave}
              disabled={saving || uploading || !form.title.trim() || (!dirty && !!editing.id)}
              className={primaryButtonClass}
            >
              {uploading ? "Téléversement en cours…" : saving ? "Enregistrement…" : dirty || !editing.id ? "Enregistrer" : "Aucune modification"}
            </button>
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
