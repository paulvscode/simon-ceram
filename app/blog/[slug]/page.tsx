import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getPostBySlug, type BlogPost } from "@/lib/blog";
import { formatPostDate, postThumbnail } from "@/lib/blog-format";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const SITE_NAME = "Simon Barraud de Lagerie";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const linkClass =
  "font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 transition-colors duration-400 hover:text-ink/70";

// Published posts for everyone; a draft only for a signed-in admin (preview).
async function findPost(slug: string): Promise<BlogPost | null> {
  const post = await getPostBySlug(slug);
  if (!post) return null;
  if (post.published) return post;
  return (await isValidSession((await cookies()).get(SESSION_COOKIE)?.value)) ? post : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findPost((await params).slug);
  if (!post) return { title: `Article introuvable — ${SITE_NAME}` };
  const thumb = postThumbnail(post, 1200);
  const images = thumb.startsWith("https://") ? [thumb] : undefined;
  return {
    title: `${post.title} — ${SITE_NAME}`,
    description: post.excerpt,
    robots: post.published ? undefined : { index: false },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.date, tags: post.tags, images },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await findPost((await params).slug);
  if (!post) notFound();

  const thumb = postThumbnail(post, 160);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.date,
    dateModified: new Date(post.updatedAt).toISOString(),
    description: post.excerpt,
    image: postThumbnail(post, 1200) || undefined,
    keywords: post.tags.join(", ") || undefined,
    author: { "@type": "Person", name: SITE_NAME },
  };

  return (
    <main>
      <Nav />
      {!post.published ? (
        <p className="bg-ink py-2 text-center font-sans text-[11px] uppercase tracking-widest text-canvas">
          Brouillon — visible seulement par vous
        </p>
      ) : null}
      <article className="grid-container py-16 md:py-24">
        <div className="grid-matrix">
          <div className="md:col-span-12 lg:col-span-8 lg:col-start-3">
            <a href="/blog" className={linkClass}>
              ← Retour au blog
            </a>
            <div className="mt-8 flex items-start gap-4 md:gap-8">
              {thumb ? (
                // Small miniature beside the title (one grid column wide on desktop).
                <div className="aspect-square w-16 shrink-0 overflow-hidden bg-well md:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className={labelClass}>
                  <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                </p>
                <h1 className="mt-4 font-sans text-3xl leading-snug tracking-wide md:text-4xl">{post.title}</h1>
              </div>
            </div>
            {post.tags.length ? (
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {post.tags.map((t) => (
                  <a
                    key={t}
                    href={`/blog?tag=${encodeURIComponent(t)}`}
                    className="font-sans text-[11px] uppercase tracking-widest text-ink/50 transition-colors duration-400 hover:text-ink"
                  >
                    #{t}
                  </a>
                ))}
              </p>
            ) : null}
          </div>

          {/* Sanitized in lib/blog.ts (lib/blog-html.ts) when read. */}
          <div
            className="rich-text mt-8 font-sans text-base leading-relaxed text-ink/80 md:col-span-12 md:mt-16 lg:col-span-8 lg:col-start-3"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="mt-16 border-t border-ink pt-4 md:col-span-12 lg:col-span-8 lg:col-start-3">
            <a href="/blog" className={linkClass}>
              ← Tous les articles
            </a>
          </div>
        </div>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Footer />
    </main>
  );
}
