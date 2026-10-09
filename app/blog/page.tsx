import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPublishedPostsWithBody } from "@/lib/blog";
import { formatPostDate, postThumbnail } from "@/lib/blog-format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Simon Barraud de Lagerie",
  description: "Notes d’atelier, cuissons et nouvelles pièces de Simon Barraud de Lagerie.",
};

type Props = { searchParams: Promise<{ tag?: string }> };

const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const chipClass = "font-sans text-[11px] uppercase tracking-widest underline-offset-4 transition-colors duration-400";

// Articles written in the admin (Blog tab), newest first. Keywords double as
// filters (?tag=…). Each article is collapsed (miniature, date, title,
// excerpt) and opens in place — a native <details>, so it works without JS.
// On the 12-column grid: a small miniature (1 column), text 9, toggle 2; the
// opened text lines up under the title.
export default async function BlogPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const posts = await getPublishedPostsWithBody();
  const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, "fr"));
  const active = tag && allTags.includes(tag) ? tag : null;
  const shown = active ? posts.filter((p) => p.tags.includes(active)) : posts;

  return (
    <main>
      <Nav />
      <section className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <h1 className="font-sans text-3xl tracking-wide md:col-span-12">Blog</h1>
          <p className="mt-8 font-sans text-sm leading-relaxed text-ink/70 md:col-span-6">
            Notes d&rsquo;atelier : cuissons, terres, émaux et nouvelles pièces.
          </p>
        </div>

        {allTags.length > 0 ? (
          <nav aria-label="Filtrer par mot-clé" className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            <a
              href="/blog"
              aria-current={active ? undefined : "page"}
              className={`${chipClass} ${active ? "text-ink/50 hover:text-ink" : "text-ink underline"}`}
            >
              Tous
            </a>
            {allTags.map((t) => (
              <a
                key={t}
                href={`/blog?tag=${encodeURIComponent(t)}`}
                aria-current={active === t ? "page" : undefined}
                className={`${chipClass} ${active === t ? "text-ink underline" : "text-ink/50 hover:text-ink"}`}
              >
                {t}
              </a>
            ))}
          </nav>
        ) : null}

        {shown.length > 0 ? (
          <ul className="mt-16 border-b border-ink/20">
            {shown.map((p) => {
              const thumb = postThumbnail(p, 160);
              return (
                <li key={p.id} id={p.slug} className="border-t border-ink/20">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none gap-4 py-8 md:grid md:grid-cols-12 md:gap-8 [&::-webkit-details-marker]:hidden">
                      <div className="aspect-square w-16 shrink-0 self-start overflow-hidden bg-well md:col-span-1 md:w-full">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 md:col-span-9">
                        <p className={labelClass}>
                          <time dateTime={p.date}>{formatPostDate(p.date)}</time>
                        </p>
                        <h2 className="mt-2 font-sans text-xl tracking-wide text-ink group-hover:underline group-hover:underline-offset-4 md:text-2xl">
                          {p.title}
                        </h2>
                        {p.excerpt ? (
                          <p className="mt-2 font-sans text-sm leading-relaxed text-ink/70 group-open:hidden">{p.excerpt}</p>
                        ) : null}
                        {p.tags.length ? (
                          <p className={`mt-4 ${labelClass}`}>{p.tags.map((t) => `#${t}`).join("  ")}</p>
                        ) : null}
                        <p className={`mt-4 md:hidden ${chipClass} text-ink underline`}>
                          <span className="group-open:hidden">Lire l&rsquo;article +</span>
                          <span className="hidden group-open:inline">Refermer −</span>
                        </p>
                      </div>
                      <p className={`hidden text-right md:col-span-2 md:block ${chipClass} text-ink underline`}>
                        <span className="group-open:hidden">Lire +</span>
                        <span className="hidden group-open:inline">Refermer −</span>
                      </p>
                    </summary>
                    <div className="pb-16 md:grid md:grid-cols-12 md:gap-8">
                      {/* Sanitized in lib/blog.ts (lib/blog-html.ts) when read. */}
                      <div
                        className="rich-text font-sans text-base leading-relaxed text-ink/80 md:col-span-8 md:col-start-2"
                        dangerouslySetInnerHTML={{ __html: p.html }}
                      />
                      <p className="mt-8 md:col-span-8 md:col-start-2">
                        <a href={`/blog/${p.slug}`} className={`${chipClass} text-ink/50 hover:text-ink`}>
                          Lien vers cet article ↗
                        </a>
                      </p>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={`mt-16 ${labelClass}`}>
            {active ? "Aucun article avec ce mot-clé." : "Les premiers articles arrivent bientôt."}
          </p>
        )}
      </section>
      <Footer />
    </main>
  );
}
