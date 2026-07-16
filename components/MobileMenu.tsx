"use client";

import { useState } from "react";
import { NAV_LINKS } from "@/lib/nav-links";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex flex-col gap-2 p-2 md:hidden"
      >
        <span className="block w-6 border-t border-ink" />
        <span className="block w-6 border-t border-ink" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[250] flex flex-col bg-canvas">
          <div className="grid-container flex w-full items-center justify-between py-8">
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="font-serif text-lg tracking-wide"
            >
              Simon Céramique
            </a>
            <button
              onClick={() => setOpen(false)}
              className="font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4"
            >
              Fermer
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-y-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-serif text-3xl tracking-wide text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
