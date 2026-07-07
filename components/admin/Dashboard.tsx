"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import type { Order } from "@/lib/orders";
import type { ContactMessage } from "@/lib/contactMessages";
import type { Keyword } from "@/lib/keywords";
import { formatEuros } from "@/lib/format";
import KeywordManager from "./KeywordManager";
import ProductTagEditor from "./ProductTagEditor";

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
    collection: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then(({ orders }: { orders: Order[] }) => {
        setOrders(orders ?? []);
        setOrdersLoading(false);
      });

    fetch("/api/contact")
      .then((res) => res.json())
      .then(({ messages }: { messages: ContactMessage[] }) => {
        setMessages(messages ?? []);
        setMessagesLoading(false);
      });

    fetch("/api/keywords")
      .then((res) => res.json())
      .then(({ keywords }: { keywords: Keyword[] }) => {
        setKeywords(keywords ?? []);
        setKeywordsLoading(false);
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
    setForm({
      title: "",
      subtitle: "",
      description: "",
      imageUrl: "",
      priceEuros: "",
      collection: "",
    });
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

  async function handleCreateKeyword(label: string) {
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const { keyword } = await res.json();
      setKeywords((prev) => [...prev, keyword].sort((a, b) => a.label.localeCompare(b.label, "fr")));
    }
  }

  async function handleRenameKeyword(id: string, label: string) {
    const res = await fetch(`/api/keywords/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      setKeywords((prev) =>
        prev
          .map((k) => (k.id === id ? { ...k, label: label.trim() } : k))
          .sort((a, b) => a.label.localeCompare(b.label, "fr"))
      );
    }
  }

  async function handleDeleteKeyword(id: string) {
    const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      setProducts((prev) => prev.map((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== id) })));
    }
  }

  async function handleUpdateProductKeywords(productId: string, keywordIds: string[]) {
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keywordIds }),
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, keywords: keywordIds } : p))
      );
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

          <label className={`mt-8 block ${labelClass}`}>Collection</label>
          <input
            value={form.collection}
            onChange={(e) => setForm({ ...form, collection: e.target.value })}
            className={inputClass}
            placeholder="Grès"
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
                    {product.collection ? ` — ${product.collection}` : ""}
                  </p>
                  <p className="mt-2 font-serif text-base">{formatEuros(product.priceCents)}</p>
                  <ProductTagEditor
                    productKeywordIds={product.keywords}
                    allKeywords={keywords}
                    onChange={(ids) => handleUpdateProductKeywords(product.id, ids)}
                  />
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
        <div className="md:col-span-4">
          <KeywordManager
            keywords={keywords}
            loading={keywordsLoading}
            onCreate={handleCreateKeyword}
            onRename={handleRenameKeyword}
            onDelete={handleDeleteKeyword}
          />
        </div>
      </div>

      <div className="grid-matrix mt-16 md:mt-24">
        <div className="md:col-span-12">
          <h2 className={labelClass}>
            Commandes en cours{" "}
            {ordersLoading ? "" : `(${orders.filter((o) => o.status === "paid").length})`}
          </h2>

          <ul className="mt-8 flex flex-col gap-y-8">
            {orders
              .filter((order) => order.status === "paid")
              .map((order) => (
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
                      <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/40">
                        Expédier vers : {order.shippingZone === "FR" ? "France" : "Belgique"}
                      </p>
                      <p className="mt-2 font-sans text-sm text-ink/70">{order.shippingAddress}</p>
                      <p className="mt-2 font-serif text-base">{formatEuros(order.totalCents)}</p>
                    </div>
                    <button
                      onClick={() => handleMarkShipped(order.id)}
                      disabled={shippingId === order.id}
                      className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
                    >
                      {shippingId === order.id ? "…" : "Marquer comme expédiée"}
                    </button>
                  </div>
                </li>
              ))}
            {!ordersLoading && orders.filter((o) => o.status === "paid").length === 0 ? (
              <li className={labelClass}>Aucune commande en attente d&rsquo;expédition.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="grid-matrix mt-16 md:mt-24">
        <div className="md:col-span-12">
          <h2 className={labelClass}>
            Commandes expédiées{" "}
            {ordersLoading ? "" : `(${orders.filter((o) => o.status === "shipped").length})`}
          </h2>

          <ul className="mt-8 flex flex-col gap-y-8">
            {orders
              .filter((order) => order.status === "shipped")
              .map((order) => (
                <li key={order.id} className="border-b border-ink/10 pb-8">
                  <p className="font-serif text-lg">
                    {order.items.map((i) => i.title).join(", ")}
                  </p>
                  <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                    {order.customerName || order.customerEmail} —{" "}
                    {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/40">
                    Expédiée vers : {order.shippingZone === "FR" ? "France" : "Belgique"}
                  </p>
                  <p className="mt-2 font-sans text-sm text-ink/70">{order.shippingAddress}</p>
                </li>
              ))}
            {!ordersLoading && orders.filter((o) => o.status === "shipped").length === 0 ? (
              <li className={labelClass}>Aucune commande expédiée pour le moment.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="grid-matrix mt-16 md:mt-24">
        <div className="md:col-span-12">
          <h2 className={labelClass}>
            Messages {messagesLoading ? "" : `(${messages.length})`}
          </h2>

          <ul className="mt-8 flex flex-col gap-y-8">
            {messages.map((msg) => (
              <li key={msg.id} className="border-b border-ink/10 pb-8">
                <div className="flex flex-wrap items-start justify-between gap-8">
                  <div>
                    <p className="font-serif text-lg">{msg.name}</p>
                    <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-ink/50">
                      {msg.email} — {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-2 max-w-xl font-sans text-sm text-ink/70">{msg.message}</p>
                  </div>
                  <a
                    href={`mailto:${msg.email}`}
                    className="shrink-0 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 hover:text-ink/70"
                  >
                    Répondre
                  </a>
                </div>
              </li>
            ))}
            {!messagesLoading && messages.length === 0 ? (
              <li className={labelClass}>Aucun message pour le moment.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
