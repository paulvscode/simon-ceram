import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPointsDeVente } from "@/lib/site-content";
import { displayUrl, mapsUrl } from "@/lib/points-de-vente";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Points de vente — Simon Barraud de Lagerie",
  description: "Les boutiques où trouver les pièces de Simon Barraud de Lagerie.",
};

const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const linkClass =
  "font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 transition-colors duration-400 hover:text-ink/70";

// List edited in the admin (Site tab → Points de vente). Shops sit on the
// 12-column grid: 3 per row on desktop, 2 on tablet, stacked on phones.
export default async function PointsDeVentePage() {
  const list = await getPointsDeVente();

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <h1 className="font-sans text-3xl tracking-wide md:col-span-12">Points de vente</h1>
          <p className="mt-8 font-sans text-sm leading-relaxed text-ink/70 md:col-span-6">
            Les pièces de l&rsquo;atelier sont aussi présentées dans ces boutiques. Elles sont
            uniques : contactez la boutique pour savoir ce qui est disponible.
          </p>
        </div>

        {list.length > 0 ? (
          <ul className="grid-matrix mt-16 gap-y-12 md:gap-y-16">
            {list.map((p, i) => {
              const maps = mapsUrl(p);
              return (
                <li key={i} className="border-t border-ink pt-4 md:col-span-6 lg:col-span-4">
                  {p.city ? <p className={labelClass}>{p.city}</p> : null}
                  <h2 className="mt-4 font-sans text-xl tracking-wide text-ink">{p.name}</h2>
                  {p.address ? <p className="mt-2 font-sans text-sm text-ink/70">{p.address}</p> : null}
                  {p.note ? <p className="mt-2 font-sans text-sm leading-relaxed text-ink/70">{p.note}</p> : null}
                  {maps || p.url ? (
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                      {maps ? (
                        <a href={maps} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          Itinéraire ↗
                        </a>
                      ) : null}
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                          {displayUrl(p.url)} ↗
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={`mt-16 ${labelClass}`}>La liste des points de vente sera bientôt disponible.</p>
        )}
      </section>
      <Footer />
    </main>
  );
}
