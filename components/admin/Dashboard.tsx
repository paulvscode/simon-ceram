"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import type { Order } from "@/lib/orders";
import type { ContactMessage } from "@/lib/contactMessages";
import type { Keyword } from "@/lib/keywords";
import type { ShopSettings } from "@/lib/shop-settings";
import type { HomeBackground } from "@/lib/home-background";
import type { LegalPage } from "@/lib/site-content";
import type { ProcessSection } from "@/lib/process-section";
import type { HeroText } from "@/lib/hero-text";
import type { PointDeVente } from "@/lib/points-de-vente";
import { isVitrine } from "@/lib/vitrine";
import { formatEuros } from "@/lib/format";
import HeroTextEditor from "./HeroTextEditor";
import HomeBackgroundEditor from "./HomeBackgroundEditor";
import KeywordManager from "./KeywordManager";
import LegalPageEditor from "./LegalPageEditor";
import PointsDeVenteEditor from "./PointsDeVenteEditor";
import ProcessSectionEditor from "./ProcessSectionEditor";
import ProductForm, { EMPTY_PRODUCT_FORM, type ProductFormValues } from "./ProductForm";
import ProductRow from "./ProductRow";
import ShopSettingsManager from "./ShopSettingsManager";
import {
  cardClass,
  checkboxClass,
  checkboxLabelClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

type Tab = "pieces" | "commandes" | "messages" | "site" | "reglages";
const TABS: Tab[] = ["pieces", "commandes", "messages", "site", "reglages"];

const shippingZoneLabel = (zone: Order["shippingZone"]) => (zone === "FR" ? "France" : "Belgique");

export default function Dashboard({
  initialProducts,
  initialShopSettings,
  initialHomeBackground,
  initialLegalPage,
  initialProcessSection,
  initialHeroText,
  initialPointsDeVente,
}: {
  initialProducts: Product[];
  initialShopSettings: ShopSettings;
  initialHomeBackground: HomeBackground;
  initialLegalPage: LegalPage;
  initialProcessSection: ProcessSection;
  initialHeroText: HeroText;
  initialPointsDeVente: PointDeVente[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pieces");

  const [products, setProducts] = useState(initialProducts);
  const [createdTitle, setCreatedTitle] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [productErrors, setProductErrors] = useState<Record<string, string>>({});

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // The server saves products as a read-modify-write of the whole catalogue,
  // so two requests in flight at once could overwrite each other. Chaining
  // every product mutation through one queue keeps them strictly sequential.
  const productQueue = useRef<Promise<unknown>>(Promise.resolve());
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = productQueue.current.then(task, task);
    productQueue.current = run.catch(() => undefined);
    return run;
  }

  useEffect(() => {
    // Restore the tab from the URL, and follow back/forward or edited #hashes.
    function syncTabFromHash() {
      const fromHash = window.location.hash.slice(1) as Tab;
      setTab(TABS.includes(fromHash) ? fromHash : "pieces");
    }
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);

    // A failed load must not look like "nothing yet": flag it for the banner.
    function load<T>(url: string, field: string, set: (items: T[]) => void, done: () => void) {
      fetch(url)
        .then(async (res) => {
          if (!res.ok) throw new Error(`${url}: ${res.status}`);
          set(((await res.json()) as Record<string, T[]>)[field] ?? []);
        })
        .catch(() => setLoadFailed(true))
        .finally(done);
    }
    load<Order>("/api/orders", "orders", setOrders, () => setOrdersLoading(false));
    load<ContactMessage>("/api/contact", "messages", setMessages, () => setMessagesLoading(false));
    load<Keyword>("/api/keywords", "keywords", setKeywords, () => setKeywordsLoading(false));

    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  function selectTab(next: Tab) {
    setTab(next);
    window.history.pushState(null, "", `#${next}`);
  }

  async function handleCreate(values: ProductFormValues): Promise<string | null> {
    setCreatedTitle(null);
    const res = await enqueue(() =>
      fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error ?? "Impossible d’ajouter la pièce.";

    setProducts((prev) => [...prev, body.product]);
    setCreatedTitle(body.product.title);
    setAddOpen(false);
    // On a phone the form collapses under your thumb; jump back up to the confirmation.
    window.scrollTo({ top: 0, behavior: "smooth" });
    return null;
  }

  async function handleEdit(product: Product, values: ProductFormValues): Promise<string | null> {
    const res = await enqueue(() =>
      fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return body.error ?? "L’enregistrement a échoué. Réessayez.";

    setProducts((prev) => prev.map((p) => (p.id === product.id ? body.product : p)));
    return null;
  }

  async function updateProduct(product: Product, patch: Partial<Product>) {
    setSavingProductId(product.id);
    setProductErrors((prev) => ({ ...prev, [product.id]: "" }));
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...patch } : p)));

    const res = await enqueue(() =>
      fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    );

    setSavingProductId(null);
    if (!res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
      setProductErrors((prev) => ({ ...prev, [product.id]: "L’enregistrement a échoué. Réessayez." }));
    }
  }

  // "Vitrine" toggle = carries the permanent Vitrine keyword (lib/vitrine.ts),
  // which the keywords API always returns.
  const vitrineKeyword = keywords.find(isVitrine);

  function toggleFeatured(product: Product, featured: boolean) {
    if (!vitrineKeyword) return;
    const others = product.keywords.filter((k) => k !== vitrineKeyword.id);
    updateProduct(product, { keywords: featured ? [...others, vitrineKeyword.id] : others });
  }

  function toggleProductKeyword(product: Product, keywordId: string) {
    const keywords = product.keywords.includes(keywordId)
      ? product.keywords.filter((k) => k !== keywordId)
      : [...product.keywords, keywordId];
    updateProduct(product, { keywords });
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Supprimer « ${product.title} » du catalogue ? Cette action est définitive.`)) {
      return;
    }
    setSavingProductId(product.id);
    const res = await enqueue(() => fetch(`/api/products/${product.id}`, { method: "DELETE" }));
    setSavingProductId(null);
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setProductErrors((prev) => ({ ...prev, [product.id]: "La suppression a échoué. Réessayez." }));
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
    // Also rewrites every product (cascade), so it goes through the product queue.
    const res = await enqueue(() => fetch(`/api/keywords/${id}`, { method: "DELETE" }));
    if (res.ok) {
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      setProducts((prev) => prev.map((p) => ({ ...p, keywords: p.keywords.filter((k) => k !== id) })));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  const pendingOrders = orders.filter((o) => o.status === "paid");
  const shippedOrders = orders.filter((o) => o.status === "shipped");

  // Short names + a count badge, so all four tabs fit a 2×2 grid on phones.
  const tabs: Record<Tab, { name: string; count: number | null; alert?: boolean }> = {
    pieces: { name: "Pièces", count: products.length },
    commandes: {
      name: "Commandes",
      count: ordersLoading ? null : pendingOrders.length,
      alert: pendingOrders.length > 0,
    },
    messages: { name: "Messages", count: messagesLoading ? null : messages.length },
    site: { name: "Site", count: null },
    reglages: { name: "Réglages", count: null },
  };

  return (
    <div className="min-h-screen bg-ink/[0.03] font-ui">
      <header className="border-b border-ink/10 bg-white">
        <div className="grid-container flex flex-wrap items-center justify-between gap-4 py-4">
          <h1 className="text-xl font-semibold text-ink">Administration</h1>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <a href="/" target="_blank" rel="noreferrer" className={secondaryButtonClass}>
              Voir le site ↗
            </a>
            <button onClick={handleLogout} className={secondaryButtonClass}>
              Se déconnecter
            </button>
          </div>
        </div>
        <nav className="grid-container grid grid-cols-2 gap-2 pb-4 sm:flex sm:flex-wrap">
          {TABS.map((t) => {
            const { name, count, alert } = tabs[t];
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => selectTab(t)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors last:col-span-2 ${
                  active ? "bg-ink text-canvas" : "bg-ink/5 text-ink/70 hover:text-ink sm:bg-transparent sm:hover:bg-ink/5"
                }`}
              >
                {name}
                {count !== null ? (
                  <span
                    className={`rounded-full px-2 text-xs ${
                      alert
                        ? "bg-red-700 text-white"
                        : active
                          ? "bg-canvas/20 text-canvas"
                          : "bg-ink/10 text-ink/70"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="grid-container py-8 md:py-12">
        {loadFailed ? (
          <p
            role="alert"
            className="mb-8 rounded border border-red-700/30 bg-red-50 p-4 text-sm text-red-800"
          >
            Une partie des données n&rsquo;a pas pu être chargée (commandes, messages ou
            mots-clés) : le stockage ne répond pas. Ce qui s&rsquo;affiche peut être incomplet —
            réessayez plus tard avant de modifier quoi que ce soit.
          </p>
        ) : null}
        {/* Tabs stay mounted (just hidden) so their state survives switching. */}
        <div className={`grid-matrix items-start ${tab === "pieces" ? "" : "hidden"}`}>
            {/* Phones: the form opens from a button so the list isn't buried
                under it. Desktop: always open in the left column. */}
            {!addOpen ? (
              <button
                onClick={() => {
                  setAddOpen(true);
                  setCreatedTitle(null);
                }}
                className={`w-full md:hidden ${primaryButtonClass}`}
              >
                + Ajouter une pièce
              </button>
            ) : null}
            <section className={`${cardClass} md:col-span-4 ${addOpen ? "" : "hidden md:block"}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className={sectionTitleClass}>Ajouter une pièce</h2>
                <button
                  onClick={() => setAddOpen(false)}
                  className={`md:hidden ${secondaryButtonClass}`}
                >
                  Fermer
                </button>
              </div>
              <div className="mt-2">
                <ProductForm
                  initialValues={EMPTY_PRODUCT_FORM}
                  submitLabel="Ajouter la pièce"
                  submittingLabel="Ajout en cours…"
                  onSubmit={handleCreate}
                  resetOnSuccess
                />
              </div>
            </section>

            <div className="mt-4 md:col-start-5 md:col-span-8 md:mt-0">
              {createdTitle ? (
                <p
                  role="status"
                  className="mb-4 rounded border border-green-800/20 bg-green-50 p-4 text-sm text-green-800"
                >
                  « {createdTitle} » a été ajoutée. Elle apparaît en haut de la liste.
                </p>
              ) : null}
              <h2 className={sectionTitleClass}>Vos pièces</h2>
              <p className={`mt-2 ${hintClass}`}>
                Les changements sont enregistrés dès que vous cochez une case.
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {/* Newest first: the piece just posted is the one you'll want to check. */}
                {[...products].reverse().map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    // The Vitrine tag has its own toggle on the card.
                    keywords={keywords.filter((k) => !isVitrine(k))}
                    saving={savingProductId === product.id}
                    error={productErrors[product.id] || null}
                    onToggleDescription={() =>
                      updateProduct(product, { showDescription: !product.showDescription })
                    }
                    onToggleOnline={(online) => updateProduct(product, { online })}
                    featured={!!vitrineKeyword && product.keywords.includes(vitrineKeyword.id)}
                    featuredDisabled={keywordsLoading || !vitrineKeyword}
                    onToggleFeatured={(featured) => toggleFeatured(product, featured)}
                    onToggleKeyword={(keywordId) => toggleProductKeyword(product, keywordId)}
                    onEdit={(values) => handleEdit(product, values)}
                    onDelete={() => handleDelete(product)}
                  />
                ))}
                {products.length === 0 ? (
                  <li className={`${cardClass} ${hintClass}`}>
                    Aucune pièce pour le moment. Ajoutez-en une avec le formulaire.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

        <div className={`grid-matrix items-start ${tab === "commandes" ? "" : "hidden"}`}>
            <section className="md:col-span-6">
              <h2 className={sectionTitleClass}>À expédier ({pendingOrders.length})</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {pendingOrders.map((order) => (
                  <li key={order.id} className={cardClass}>
                    <p className="text-base font-semibold text-ink">
                      {order.items.map((i) => i.title).join(", ")}
                    </p>
                    <p className={`mt-2 ${hintClass}`}>
                      {order.customerName || order.customerEmail} · commandé le{" "}
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                      {formatEuros(order.totalCents)}
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      <span className="font-medium">Adresse ({shippingZoneLabel(order.shippingZone)}) :</span>{" "}
                      {order.shippingAddress}
                    </p>
                    <button
                      onClick={() => handleMarkShipped(order.id)}
                      disabled={shippingId === order.id}
                      className={`mt-4 ${primaryButtonClass}`}
                    >
                      {shippingId === order.id ? "Enregistrement…" : "Marquer comme expédiée"}
                    </button>
                  </li>
                ))}
                {ordersLoading ? <li className={hintClass}>Chargement…</li> : null}
                {!ordersLoading && pendingOrders.length === 0 ? (
                  <li className={`${cardClass} ${hintClass}`}>Aucune commande en attente d&rsquo;expédition.</li>
                ) : null}
              </ul>
            </section>

            <section className="mt-8 md:col-start-7 md:col-span-6 md:mt-0">
              <h2 className={sectionTitleClass}>Expédiées ({shippedOrders.length})</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {shippedOrders.map((order) => (
                  <li key={order.id} className={cardClass}>
                    <p className="text-base font-semibold text-ink">
                      {order.items.map((i) => i.title).join(", ")}
                    </p>
                    <p className={`mt-2 ${hintClass}`}>
                      {order.customerName || order.customerEmail} · commandé le{" "}
                      {new Date(order.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                      {shippingZoneLabel(order.shippingZone)}
                    </p>
                    <p className="mt-2 text-sm text-ink/70">{order.shippingAddress}</p>
                  </li>
                ))}
                {!ordersLoading && shippedOrders.length === 0 ? (
                  <li className={`${cardClass} ${hintClass}`}>Aucune commande expédiée pour le moment.</li>
                ) : null}
              </ul>
            </section>
          </div>

        <div className={`grid-matrix items-start ${tab === "messages" ? "" : "hidden"}`}>
            <section className="md:col-span-8">
              <h2 className={sectionTitleClass}>Messages reçus ({messages.length})</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {messages.map((msg) => (
                  <li key={msg.id} className={cardClass}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-ink">{msg.name}</p>
                        <p className={hintClass}>
                          {msg.email} · {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <a href={`mailto:${msg.email}`} className={secondaryButtonClass}>
                        Répondre par e-mail
                      </a>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm text-ink/80">{msg.message}</p>
                  </li>
                ))}
                {messagesLoading ? <li className={hintClass}>Chargement…</li> : null}
                {!messagesLoading && messages.length === 0 ? (
                  <li className={`${cardClass} ${hintClass}`}>Aucun message pour le moment.</li>
                ) : null}
              </ul>
            </section>
          </div>

        <div className={`grid-matrix items-start ${tab === "site" ? "" : "hidden"}`}>
          <div className="flex flex-col gap-4 md:col-span-6 md:gap-8">
            <HeroTextEditor initialHero={initialHeroText} />
            <HomeBackgroundEditor
              initialBackground={initialHomeBackground}
              hero={initialHeroText}
              vitrineProducts={products.filter(
                (p) => p.online && !!vitrineKeyword && p.keywords.includes(vitrineKeyword.id)
              )}
            />
            <ProcessSectionEditor initialSection={initialProcessSection} />
          </div>
          <div className="mt-4 md:col-start-7 md:col-span-6 md:mt-0">
            <div className="flex flex-col gap-4 md:gap-8">
              <PointsDeVenteEditor initialList={initialPointsDeVente} />
              <LegalPageEditor initialPage={initialLegalPage} />
            </div>
          </div>
        </div>

        <div className={`grid-matrix items-start ${tab === "reglages" ? "" : "hidden"}`}>
            <div className="md:col-span-6">
              <ShopSettingsManager initialSettings={initialShopSettings} />
            </div>
            <div className="mt-8 md:col-start-7 md:col-span-6 md:mt-0">
              <KeywordManager
                keywords={keywords}
                loading={keywordsLoading}
                onCreate={handleCreateKeyword}
                onRename={handleRenameKeyword}
                onDelete={handleDeleteKeyword}
              />
            </div>
          </div>
      </main>
    </div>
  );
}
