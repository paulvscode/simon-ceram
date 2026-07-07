"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import type { Order } from "@/lib/orders";
import { formatEuros } from "@/lib/format";

const inputClass =
  "mt-2 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-lg text-ink outline-none focus:border-ink";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";

export default function Dashboard({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    priceEuros: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then(({ orders }: { orders: Order[] }) => {
        setOrders(orders ?? []);
        setOrdersLoading(false);
      });
  }, []);

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
    setForm({ title: "", subtitle: "", description: "", imageUrl: "", priceEuros: "" });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleMarkShipped(id: string) {
    setShippingId(id);
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH" });
    setShippingId(null);
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "shipped" } : o)));
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

          <label className={`mt-8 block ${labelClass}`}>Prix (€)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.priceEuros}
            onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
            className={inputClass}
            placeholder="180.00"
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
                  <p className="font-serif text-xl">
                    {product.title}
                    {product.sold ? (
                      <span className="ml-4 font-sans text-[11px] uppercase tracking-widest text-ink/40">
                        Vendu
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                    {product.subtitle}
                  </p>
                  <p className="mt-2 font-serif text-base">{formatEuros(product.priceCents)}</p>
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

      <div className="grid-matrix mt-16 md:mt-24">
        <div className="md:col-span-12">
          <h2 className={labelClass}>
            Commandes {ordersLoading ? "" : `(${orders.length})`}
          </h2>

          <ul className="mt-8 flex flex-col gap-y-8">
            {orders.map((order) => (
              <li key={order.id} className="border-b border-ink/10 pb-8">
                <div className="flex flex-wrap items-start justify-between gap-8">
                  <div>
                    <p className="font-serif text-lg">
                      {order.items.map((i) => i.title).join(", ")}
                    </p>
                    <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                      {order.customerName || order.customerEmail} —{" "}
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-2 font-sans text-sm text-ink/70">{order.shippingAddress}</p>
                    <p className="mt-2 font-serif text-base">{formatEuros(order.totalCents)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-4">
                    <span className="font-sans text-[11px] uppercase tracking-widest text-ink/40">
                      {order.status === "shipped" ? "Expédiée" : "Payée"}
                    </span>
                    {order.status === "paid" ? (
                      <button
                        onClick={() => handleMarkShipped(order.id)}
                        disabled={shippingId === order.id}
                        className="font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
                      >
                        {shippingId === order.id ? "…" : "Marquer comme expédiée"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
            {!ordersLoading && orders.length === 0 ? (
              <li className={labelClass}>Aucune commande pour le moment.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
