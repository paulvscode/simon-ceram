import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getCgvPage, getSaleSettings } from "@/lib/site-content";
import { vatMention } from "@/lib/sale-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Simon Barraud de Lagerie",
};

const richTextClass =
  "rich-text font-sans text-sm leading-relaxed text-ink/80 [&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-wide [&_h3]:font-sans [&_h3]:text-lg [&_h3]:font-normal";

// Text edited in the admin (Vente tab → CGV), followed by the seller's
// identity, VAT mention and consumer mediator, filled in from the Vente
// settings so they're written in one place only.
export default async function CgvPage() {
  const [{ html, updatedAt }, s] = await Promise.all([getCgvPage(), getSaleSettings()]);
  const seller = [
    s.legalForm ? `${s.sellerName} — ${s.legalForm}` : s.sellerName,
    s.address,
    s.siret ? `SIRET : ${s.siret}` : "",
    s.vatRegime === "assujetti" && s.vatNumber ? `N° de TVA intracommunautaire : ${s.vatNumber}` : "",
    vatMention(s),
  ].filter(Boolean);

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <div className="md:col-span-12">
            <h1 className="font-sans text-3xl tracking-wide">Conditions générales de vente</h1>
          </div>
        </div>

        <div className="grid-matrix mt-16">
          <div className="md:col-span-8 lg:col-span-7">
            {html ? (
              <div className={richTextClass} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50">
                Cette page est en cours de rédaction.
              </p>
            )}

            <div className={`mt-12 ${richTextClass}`}>
              <h2>Vendeur</h2>
              <p>
                {seller.map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
                {s.email ? <a href={`mailto:${s.email}`}>{s.email}</a> : null}
                {s.phone ? ` · ${s.phone}` : null}
              </p>
              {s.mediatorName ? (
                <>
                  <h2>Médiateur de la consommation</h2>
                  <p>
                    Conformément à l&rsquo;article L.612-1 du Code de la consommation, vous pouvez
                    recourir gratuitement au médiateur suivant : {s.mediatorName}
                    {s.mediatorAddress ? `, ${s.mediatorAddress}` : ""}
                    {s.mediatorUrl ? (
                      <>
                        {" — "}
                        <a href={s.mediatorUrl} target="_blank" rel="noopener noreferrer">
                          {s.mediatorUrl.replace(/^https?:\/\//, "")}
                        </a>
                      </>
                    ) : null}
                    .
                  </p>
                </>
              ) : null}
            </div>

            {updatedAt ? (
              <p className="mt-16 font-sans text-[11px] uppercase tracking-widest text-ink/40">
                Mise à jour le{" "}
                {new Date(updatedAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
