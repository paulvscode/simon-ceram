"use client";

import { useState } from "react";
import { productImageUrl } from "@/lib/product-image";

/**
 * A product's square picture frame. With a second photo:
 * - devices that can really hover (mouse, trackpad): the second photo
 *   cross-fades in on hover, as before;
 * - touch devices (`hover: none`): a swipeable gallery with scroll-snap and
 *   position dots — a tap no longer triggers a "hover" that gets stuck on the
 *   second photo.
 * Both variants are in the markup; CSS shows one, and lazy loading means the
 * hidden one's images are never fetched.
 */
export default function ProductImages({
  title,
  imageUrl,
  hoverImageUrl,
  sold,
  layout = "card",
}: {
  title: string;
  imageUrl: string;
  hoverImageUrl: string;
  sold: boolean;
  // "page" (the piece's own page): on hover-capable devices every photo is
  // shown, stacked, instead of the cross-fade; touch devices keep the gallery.
  layout?: "card" | "page";
}) {
  const [index, setIndex] = useState(0);
  const tone = sold ? "grayscale" : "";
  const photos = [imageUrl, hoverImageUrl].filter(Boolean).map(productImageUrl);

  if (layout === "page" && photos.length > 1) {
    return (
      <>
        <div className="hidden flex-col gap-8 [@media(hover:hover)]:flex">
          {photos.map((src, i) => (
            <div key={src} className="relative aspect-square w-full overflow-hidden bg-well">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={i === 0 ? title : `${title} — photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className={`block h-full w-full object-contain ${tone}`}
              />
              {sold && i === 0 ? <SoldBadge /> : null}
            </div>
          ))}
        </div>
        <div className="[@media(hover:hover)]:hidden">
          <ProductImages title={title} imageUrl={imageUrl} hoverImageUrl={hoverImageUrl} sold={sold} />
        </div>
      </>
    );
  }

  return (
    <div className="group relative aspect-square w-full overflow-hidden bg-well">
      {photos.length === 1 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[0]} alt={title} loading="lazy" className={`block h-full w-full object-contain ${tone}`} />
      ) : null}

      {photos.length === 2 ? (
        <>
          {/* Hover-capable devices: cross-fade. */}
          <div className="absolute inset-0 [@media(hover:none)]:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt={title} loading="lazy" className={`block h-full w-full object-contain ${tone}`} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[1]}
              alt=""
              aria-hidden
              loading="lazy"
              className={`absolute inset-0 h-full w-full bg-well object-contain opacity-0 transition-opacity duration-300 ease-out [@media(hover:hover)]:group-hover:opacity-100 ${tone}`}
            />
          </div>

          {/* Touch devices: swipe between the two photos. */}
          <div
            role="region"
            aria-roledescription="galerie"
            aria-label={`Photos de ${title}`}
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="no-scrollbar absolute inset-0 hidden snap-x snap-mandatory overflow-x-auto overscroll-x-contain [@media(hover:none)]:flex"
          >
            {photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={i === 0 ? title : `${title} — photo ${i + 1}`}
                loading="lazy"
                draggable={false}
                className={`h-full w-full shrink-0 snap-center object-contain ${tone}`}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 gap-2 [@media(hover:none)]:flex"
          >
            {photos.map((src, i) => (
              <span
                key={src}
                // Light outline so the dots stay visible on dark photos too.
                className={`h-2 w-2 rounded-full ring-1 ring-canvas/80 transition-colors ${
                  i === index ? "bg-ink" : "bg-canvas/70"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      {sold ? <SoldBadge /> : null}
    </div>
  );
}

function SoldBadge() {
  return (
    <span className="absolute left-4 top-4 bg-canvas px-2 font-sans leading-6 text-[11px] uppercase tracking-widest text-ink">
      Vendu
    </span>
  );
}
