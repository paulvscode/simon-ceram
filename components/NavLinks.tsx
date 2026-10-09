"use client";

import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/nav-links";

// Desktop menu links (xl and up). The current section is underlined, so
// visitors see where they are; a product page (/shop/…) counts as Shop.
export const navLinkClass =
  "font-sans text-xs font-medium uppercase tracking-widest text-ink transition-colors duration-400 hover:text-ink/60";

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-8 xl:flex">
      {NAV_LINKS.map((link) => {
        const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <a
              href={link.href}
              aria-current={current ? "page" : undefined}
              className={`block ${navLinkClass} ${current ? "underline decoration-2 underline-offset-8" : ""}`}
            >
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
