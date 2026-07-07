/**
 * Fixed (not `background-attachment: fixed`, which iOS Safari ignores)
 * full-viewport image sitting behind the Hero. The sections that follow
 * it in app/page.tsx carry their own opaque bg-canvas, so scrolling past
 * the hero visually covers this image rather than sliding it away.
 */
export default function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/1000031199.jpg"
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-canvas/60" />
    </div>
  );
}
