import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { getSaleSettings } from "@/lib/site-content";
import { formatEuros } from "@/lib/format";
import { vatMention } from "@/lib/sale-settings";
import PrintButton from "@/components/admin/PrintButton";
import { secondaryButtonClass } from "@/components/admin/ui";

// Behind the admin login (proxy.ts matches /admin/*).
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Facture", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

// Shown on screen when a required field is still empty in the Vente tab.
function Missing({ label }: { label: string }) {
  return <span className="text-red-700 print:text-ink">[{label} — à compléter dans l’onglet Vente]</span>;
}

/**
 * Printable invoice for a paid order, with the mentions required in France:
 * seller identity and SIRET, consecutive number, date, buyer, items, totals
 * and VAT (or the art. 293 B exemption).
 */
export default async function InvoicePage({ params }: Props) {
  const [order, s] = await Promise.all([getOrderById((await params).id), getSaleSettings()]);
  if (!order || order.status === "refunded") notFound();

  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" });
  const vatRate = s.vatRegime === "assujetti" ? s.vatRate : 0;
  const totalHt = Math.round(order.totalCents / (1 + vatRate / 100));
  const cell = "border-b border-ink/10 py-2";

  return (
    <div className="min-h-screen bg-ink/[0.03] font-ui text-ink print:bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 print:p-0">
        <div className="mb-8 flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <a href="/admin#commandes" className={secondaryButtonClass}>
            ← Retour aux commandes
          </a>
        </div>

        <article className="rounded border border-ink/10 bg-white p-8 text-sm print:border-0 print:p-0">
          <header className="flex flex-wrap justify-between gap-8">
            <div>
              <p className="text-base font-semibold">{s.sellerName}</p>
              <p>{s.legalForm || <Missing label="Forme juridique" />}</p>
              <p>{s.address || <Missing label="Adresse" />}</p>
              <p>SIRET : {s.siret || <Missing label="SIRET" />}</p>
              {s.vatRegime === "assujetti" ? (
                <p>N° TVA : {s.vatNumber || <Missing label="N° de TVA" />}</p>
              ) : null}
              {s.email ? <p>{s.email}</p> : null}
              {s.phone ? <p>{s.phone}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">Facture</p>
              <p className="mt-2">
                N° <strong>{order.invoiceNumber ?? "—"}</strong>
              </p>
              <p>Date : {date}</p>
            </div>
          </header>

          <section className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Client</p>
            <p className="mt-2 font-medium">{order.customerName || "—"}</p>
            {order.shippingAddress ? <p>{order.shippingAddress}</p> : null}
            {order.customerEmail ? <p>{order.customerEmail}</p> : null}
          </section>

          <table className="mt-8 w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink/50">
                <th className={`${cell} font-medium`}>Désignation</th>
                <th className={`${cell} text-right font-medium`}>Qté</th>
                <th className={`${cell} text-right font-medium`}>
                  Prix {vatRate ? "TTC" : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className={cell}>{item.title} — pièce unique</td>
                  <td className={`${cell} text-right`}>1</td>
                  <td className={`${cell} text-right`}>{formatEuros(item.priceCents)}</td>
                </tr>
              ))}
              <tr>
                <td className={cell}>Livraison ({order.shippingZone === "BE" ? "Belgique" : "France"})</td>
                <td className={`${cell} text-right`}>1</td>
                <td className={`${cell} text-right`}>{formatEuros(order.shippingCents)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ml-auto mt-4 w-full max-w-xs">
            {vatRate ? (
              <>
                <p className="flex justify-between py-2">
                  <span>Total HT</span>
                  <span>{formatEuros(totalHt)}</span>
                </p>
                <p className="flex justify-between py-2">
                  <span>TVA {vatRate} %</span>
                  <span>{formatEuros(order.totalCents - totalHt)}</span>
                </p>
              </>
            ) : null}
            <p className="flex justify-between border-t border-ink py-2 text-base font-semibold">
              <span>Total {vatRate ? "TTC" : ""}</span>
              <span>{formatEuros(order.totalCents)}</span>
            </p>
            {!vatRate ? <p className="text-right text-xs">{vatMention(s)}</p> : null}
          </div>

          <p className="mt-8 text-xs text-ink/70">
            Payée le {date} par carte bancaire (paiement en ligne Stripe).
          </p>
        </article>
      </div>
    </div>
  );
}
