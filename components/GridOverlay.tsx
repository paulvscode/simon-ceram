"use client";

import { useEffect, useState } from "react";

/**
 * claude.MD §3 verification harness: toggle with the "G" key.
 * Pink verticals = the 12-column matrix (single column below md).
 * Blue horizontals = the 8px baseline rhythm.
 */
export default function GridOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "g") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      setVisible((v) => !v);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(37,99,235,0.35) 0px, rgba(37,99,235,0.35) 1px, transparent 1px, transparent 8px)",
        }}
      />

      <div className="grid-container hidden h-full md:block">
        <div className="grid h-full grid-cols-12 gap-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full bg-pink-500/10" />
          ))}
        </div>
      </div>

      <div className="grid-container block h-full md:hidden">
        <div className="h-full bg-pink-500/10" />
      </div>

      <div className="fixed bottom-4 left-4 bg-ink px-4 py-2 font-sans text-[10px] uppercase tracking-widest text-canvas">
        Grid overlay — press G to hide
      </div>
    </div>
  );
}
