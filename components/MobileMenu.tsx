"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/nav-links";
import Logo from "./Logo";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = pathname === "/" ? NAV_LINKS : [{ label: "Accueil", href: "/" }, ...NAV_LINKS];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex items-center gap-2 p-2 xl:hidden"
      >
        {/* The label needs room the long wordmark doesn't leave on phones. */}
        <span
          aria-hidden="true"
          className="hidden font-sans text-xs font-medium uppercase tracking-widest text-ink sm:inline"
        >
          Menu
        </span>
        <span aria-hidden="true" className="flex flex-col gap-2">
          <span className="block w-6 border-t-2 border-ink" />
          <span className="block w-6 border-t-2 border-ink" />
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[250] flex flex-col bg-canvas">
          <div className="grid-container flex w-full items-center justify-between py-8">
            <a href="/" onClick={() => setOpen(false)} aria-label="Simon Barraud de Lagerie — accueil">
              <Logo />
            </a>
            <button
              onClick={() => setOpen(false)}
              className="font-sans text-[11px] uppercase tracking-widest text-ink/50 underline underline-offset-4"
            >
              Fermer
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-y-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-sans text-3xl tracking-wide text-ink"
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
