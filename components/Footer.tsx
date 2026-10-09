import Logo from "./Logo";
import { NAV_LINKS } from "@/lib/nav-links";

const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const linkClass = "font-sans text-sm text-ink/80 transition-colors duration-400 hover:text-ink";

/**
 * Compact site footer, two rows spanning the grid's outer edges
 * (first column's left edge to last column's right edge):
 *   logo                 ·  links in a line
 *   atelier details      ·  ©, Mentions légales and CGV
 * Each row is a wrapping flex rather than fixed column slots: the long
 * wordmark doesn't fit a 4-column slot below ~1100px, so the right-hand part
 * drops under the left one only when the two don't fit side by side.
 * Full-bleed top rule; opaque bg-canvas to cover the homepage's fixed hero.
 */
export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-canvas">
      <div className="grid-container py-12 md:py-16">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <a href="/" aria-label="Simon Barraud de Lagerie — accueil" className="inline-block">
            <Logo />
          </a>
          <nav aria-label="Pied de page">
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              <li>
                <a href="/" className={linkClass}>
                  Accueil
                </a>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-ink/10 pt-8">
          <address className="flex flex-wrap gap-x-8 gap-y-2 font-sans text-sm not-italic text-ink/70">
            <span>12 rue des Tanneurs, Dieulefit</span>
            <span>Livraison en France et en Belgique</span>
            <a href="mailto:atelier@simon-ceramique.fr" className={linkClass}>
              atelier@simon-ceramique.fr
            </a>
          </address>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <p className={labelClass}>&copy; {new Date().getFullYear()} Simon Barraud de Lagerie</p>
            <a href="/mentions-legales" className={`${labelClass} transition-colors duration-400 hover:text-ink`}>
              Mentions légales
            </a>
            <a href="/conditions-generales-de-vente" className={`${labelClass} transition-colors duration-400 hover:text-ink`}>
              CGV
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
