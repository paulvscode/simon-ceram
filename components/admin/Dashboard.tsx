"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";

const inputClass =
  "mt-2 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-lg text-ink outline-none focus:border-ink";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";

export default function Dashboard({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", imageUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Impossible de créer la pièce.");
      return;
    }

    const { product } = await res.json();
    setProducts((prev) => [...prev, product]);
    setForm({ title: "", subtitle: "", description: "", imageUrl: "" });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="grid-container py-16 md:py-24">
      <div className="grid-matrix">
        <div className="flex items-center justify-between md:col-span-12">
          <h1 className="font-serif text-2xl tracking-wide">Tableau de bord</h1>
          <button
            onClick={handleLogout}
            className="font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <div className="grid-matrix mt-16 md:mt-24">
        <form onSubmit={handleCreate} className="md:col-span-4">
          <h2 className={labelClass}>Nouvelle pièce</h2>

          <label className={`mt-8 block ${labelClass}`}>Titre</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />

          <label className={`mt-8 block ${labelClass}`}>Sous-titre / année</label>
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className={inputClass}
            placeholder="Grès — 2026"
          />

          <label className={`mt-8 block ${labelClass}`}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className={`${inputClass} resize-none`}
          />

          <label className={`mt-8 block ${labelClass}`}>URL de l&rsquo;image</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className={inputClass}
            placeholder="https://…"
          />

          {error ? <p className={`mt-4 ${labelClass}`}>{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
          >
            {submitting ? "Ajout…" : "Ajouter au catalogue"}
          </button>
        </form>

        <div className="mt-16 md:col-start-6 md:col-span-7 md:mt-0">
          <h2 className={labelClass}>Catalogue actif ({products.length})</h2>

          <ul className="mt-8 flex flex-col gap-y-8">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex items-start justify-between gap-8 border-b border-ink/10 pb-8"
              >
                <div>
                  <p className="font-serif text-xl">{product.title}</p>
                  <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                    {product.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingId === product.id}
                  className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4 hover:text-ink disabled:text-ink/20"
                >
                  {deletingId === product.id ? "Suppression…" : "Supprimer"}
                </button>
              </li>
            ))}
            {products.length === 0 ? (
              <li className={labelClass}>Aucune pièce pour le moment.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
