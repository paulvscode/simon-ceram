import CartWidget from "./CartWidget";
import MobileMenu from "./MobileMenu";
import Logo from "./Logo";
import { NAV_LINKS } from "@/lib/nav-links";

export default function Nav() {
  return (
    <header className="grid-container py-8">
      <nav className="flex items-center justify-between">
        <a href="/" aria-label="Simon Barraud de Lagerie — accueil">
          <Logo />
        </a>
        <div className="flex items-center gap-8">
          {/* Six spaced capitals beside the long wordmark need ~950px: below xl
              (1280px) the burger menu takes over. */}
          <ul className="hidden items-center gap-8 xl:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-sans text-[11px] uppercase tracking-widest text-ink/70 transition-colors duration-400 hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <CartWidget />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
