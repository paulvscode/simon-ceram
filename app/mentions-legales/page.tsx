import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getLegalPage } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentions légales — Simon Barraud",
};

export default async function LegalPage() {
  // Already sanitized against the editor's allowlist (lib/legal-html.ts).
  const { html, updatedAt } = await getLegalPage();

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <div className="md:col-span-12">
            <h1 className="font-serif text-3xl tracking-wide">Mentions légales</h1>
          </div>
        </div>

        <div className="grid-matrix mt-16">
          <div className="md:col-span-8 lg:col-span-7">
            {html ? (
              <div
                className="rich-text font-sans text-sm leading-relaxed text-ink/80 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-wide [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-normal"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50">
                Cette page est en cours de rédaction.
              </p>
            )}
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
