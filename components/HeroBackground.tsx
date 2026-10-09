import { homeBackgroundFilter, type HomeBackground } from "@/lib/home-background";

/**
 * Fixed (not `background-attachment: fixed`, which iOS Safari ignores)
 * full-viewport image sitting behind the Hero. The sections that follow
 * it in app/page.tsx carry their own opaque bg-canvas, so scrolling past
 * the hero visually covers this image rather than sliding it away.
 *
 * Image, filters and veil come from the admin (Site tab); the admin's live
 * preview uses the same homeBackgroundFilter(), so what's saved is what shows.
 */
export default function HeroBackground({ background }: { background: HomeBackground }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={background.imageUrl}
        alt=""
        className="h-full w-full object-cover"
        style={{ filter: homeBackgroundFilter(background), opacity: background.imageOpacity / 100 }}
      />
      <div className="absolute inset-0 bg-canvas" style={{ opacity: background.veil / 100 }} />
      {/* Soft light fade behind the menu, so the logo and links read on any
          image regardless of the admin's veil setting. */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-canvas/90 via-canvas/60 to-transparent" />
    </div>
  );
}
