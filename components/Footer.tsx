import Logo from "./Logo";
import { NAV_LINKS } from "@/lib/nav-links";

const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";
const linkClass = "font-sans text-sm text-ink/80 transition-colors duration-400 hover:text-ink";

/**
 * Site footer: full-bleed top rule to separate it from the page, then
 * brand (cols 1–4) · navigation (6–8) · atelier details (9–12) from lg up
 * — on tablet the brand takes the first row and the two lists split the
 * second, since md columns are too narrow for the address — and a
 * bottom bar for © and legal. Opaque bg-canvas so it covers the homepage's
 * fixed hero image.
 */
export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-canvas">
      <div className="grid-container pb-8 pt-16 md:pt-24">
        <div className="grid-matrix">
          <div className="md:col-span-12 lg:col-span-4">
            <a href="/" aria-label="Simon Barraud — accueil" className="inline-block">
              <Logo />
            </a>
            <p className="mt-8 max-w-xs font-sans text-sm leading-relaxed text-ink/60">
              Pièces uniques façonnées à la main, en grès et porcelaine, cuites au four à bois.
            </p>
          </div>

          <nav aria-label="Pied de page" className="mt-12 md:col-span-6 lg:col-start-6 lg:col-span-3 lg:mt-0">
            <p className={labelClass}>Navigation</p>
            <ul className="mt-4 flex flex-col gap-y-4 md:gap-y-2">
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

          <div className="mt-12 md:col-start-7 md:col-span-6 lg:col-start-9 lg:col-span-4 lg:mt-0">
            <p className={labelClass}>L&rsquo;atelier</p>
            <address className="mt-4 flex flex-col gap-y-4 md:gap-y-2 font-sans text-sm not-italic text-ink/80">
              <span>12 rue des Tanneurs, Dieulefit</span>
              <span>Livraison en France et en Belgique</span>
              <a href="mailto:atelier@simon-ceramique.fr" className={linkClass}>
                atelier@simon-ceramique.fr
              </a>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between md:mt-24">
          <p className={labelClass}>&copy; {new Date().getFullYear()} Simon Barraud</p>
          <a href="/mentions-legales" className={`${labelClass} transition-colors duration-400 hover:text-ink`}>
            Mentions légales
          </a>
        </div>
      </div>
    </footer>
  );
}
