"use client";

import { useEffect, useRef, useState } from "react";
import { homeBackgroundFilter, type HomeBackground } from "@/lib/home-background";
import { HERO_SIZE_PX, type HeroSize } from "@/lib/hero-text";
import { formatEuros } from "@/lib/format";
import { productImageUrl } from "@/lib/product-image";
import type { Product } from "@/lib/products";
import { HERO_PANEL_CLASS } from "@/components/Hero";

/*
 * Live, scrollable miniature of the homepage for the admin: the hero photo
 * (with every background setting) stays fixed while the page — hero phrase,
 * then the Vitrine with the real selected pieces — scrolls over it, exactly
 * like the site. It's laid out at real dimensions (1280px desktop / 390px
 * phone) and scaled down to fit, so proportions match; sizes are inline px
 * because the project's spacing scale only allows 8px steps.
 */

export type PreviewDevice = "desktop" | "phone";

const VIEWPORT: Record<PreviewDevice, { w: number; h: number; gutter: number }> = {
  desktop: { w: 1280, h: 800, gutter: 64 },
  phone: { w: 390, h: 844, gutter: 16 },
};
const CANVAS = "251 251 250"; // #FBFBFA

export default function HomepagePreview({
  bg,
  hero,
  products,
  device,
}: {
  bg: HomeBackground;
  hero: { quote: string; signature: string; size: HeroSize };
  products: Product[];
  device: PreviewDevice;
}) {
  const { w, h, gutter } = VIEWPORT[device];
  const desktop = device === "desktop";
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  // Fit the virtual page to the frame's width, and follow resizes.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / w);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);

  // Start each device view at the top. Braces, not an expression body: in
  // recent browsers scrollTo() returns a Promise, and an effect must return
  // nothing (or a cleanup function).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [device]);

  function scrollToVitrine() {
    // Just enough to show the Vitrine sliding over the bottom of the photo.
    scrollRef.current?.scrollTo({ top: h * 0.7, behavior: "smooth" });
  }

  const quoteSize = HERO_SIZE_PX[hero.size][desktop ? 2 : 0];
  const contentWidth = w - gutter * 2;
  // Desktop panel spans 7 of 12 columns (32px gutters), as on the site.
  const panelWidth = desktop ? ((contentWidth - 11 * 32) / 12) * 7 + 6 * 32 : contentWidth;
  const shown = products.slice(0, desktop ? 6 : 3);

  return (
    <div>
      <div ref={frameRef} className={desktop ? "w-full" : "mx-auto w-64"}>
        <div
          className="relative overflow-hidden rounded border border-ink/20 bg-canvas"
          style={{ height: h * scale }}
        >
          <div className="relative" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {/* The fixed photo layer — same settings as components/HeroBackground. */}
            <div className="absolute inset-0" aria-hidden="true">
              {bg.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bg.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ filter: homeBackgroundFilter(bg), opacity: bg.imageOpacity / 100 }}
                />
              ) : null}
              <div className="absolute inset-0 bg-canvas" style={{ opacity: bg.veil / 100 }} />
              <div
                className="absolute inset-x-0 top-0 bg-gradient-to-b from-canvas/90 via-canvas/60 to-transparent"
                style={{ height: 192 }}
              />
            </div>

            {/* The page, scrolling over the photo. */}
            <div ref={scrollRef} className="no-scrollbar absolute inset-0 overflow-y-auto font-sans text-ink">
              <div className="flex items-center justify-between" style={{ padding: `32px ${gutter}px` }}>
                <span style={{ fontSize: desktop ? 20 : 15 }}>
                  Simon <strong className="font-semibold uppercase tracking-[0.08em]">Barraud de Lagerie</strong>
                </span>
                {desktop ? (
                  <span className="uppercase tracking-widest" style={{ fontSize: 12 }}>
                    Shop&nbsp;&nbsp;&nbsp;Processus&nbsp;&nbsp;&nbsp;Atelier&nbsp;&nbsp;&nbsp;Points de vente&nbsp;&nbsp;&nbsp;Contact
                  </span>
                ) : (
                  <span className="flex flex-col gap-2" aria-hidden="true">
                    <span className="block w-6 border-t-2 border-ink" />
                    <span className="block w-6 border-t-2 border-ink" />
                  </span>
                )}
              </div>

              {/* Hero */}
              <div className="flex items-center" style={{ minHeight: h - 104, padding: `0 ${gutter}px` }}>
                <div className={HERO_PANEL_CLASS} style={{ width: panelWidth, padding: desktop ? 48 : 24 }}>
                  <p className="whitespace-pre-line italic leading-snug tracking-wide" style={{ fontSize: quoteSize }}>
                    {hero.quote}
                  </p>
                  {hero.signature ? (
                    <p className="uppercase tracking-widest text-ink/60" style={{ fontSize: 11, marginTop: 32 }}>
                      {hero.signature}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Vitrine, at its background opacity */}
              <div
                style={{
                  backgroundColor: `rgb(${CANVAS} / ${bg.vitrineOpacity / 100})`,
                  padding: `${desktop ? 96 : 64}px ${gutter}px`,
                }}
              >
                <p className="tracking-wide" style={{ fontSize: 30 }}>
                  Vitrine
                </p>
                {shown.length === 0 ? (
                  <p className="uppercase tracking-widest text-ink/50" style={{ fontSize: 11, marginTop: 16 }}>
                    (Aucune pièce dans la Vitrine : sur le site, cette section n&rsquo;apparaît pas.)
                  </p>
                ) : null}
                <div
                  className="grid"
                  style={{ marginTop: 64, gap: "64px 32px", gridTemplateColumns: desktop ? "repeat(3, 1fr)" : "1fr" }}
                >
                  {(shown.length ? shown : [null, null, null]).map((p, i) => (
                    <div key={p?.id ?? i}>
                      <div className="aspect-square w-full bg-well">
                        {p?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={productImageUrl(p.imageUrl)} alt="" className="h-full w-full object-contain" />
                        ) : null}
                      </div>
                      <p className="tracking-wide" style={{ fontSize: 24, marginTop: 32 }}>
                        {p?.title ?? "Pièce"}
                      </p>
                      <p style={{ fontSize: 18, marginTop: 16 }}>{p ? formatEuros(p.priceCents) : "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer stub: always opaque on the site. */}
              <div className="border-t border-ink/10 bg-canvas uppercase tracking-widest text-ink/50" style={{ padding: `48px ${gutter}px`, fontSize: 11 }}>
                Pied de page
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="rounded border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-ink"
        >
          Haut de page
        </button>
        <button
          type="button"
          onClick={scrollToVitrine}
          className="rounded border border-ink/20 px-4 py-2 text-sm font-medium text-ink hover:border-ink"
        >
          Vitrine
        </button>
      </div>
    </div>
  );
}
