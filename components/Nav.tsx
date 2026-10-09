import CartWidget from "./CartWidget";
import MobileMenu from "./MobileMenu";
import Logo from "./Logo";
import NavLinks from "./NavLinks";

export default function Nav() {
  return (
    <header className="grid-container py-8">
      <nav className="flex items-center justify-between">
        <a href="/" aria-label="Simon Barraud de Lagerie — accueil">
          <Logo />
        </a>
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Six spaced capitals beside the long wordmark need ~1000px: below
              xl (1280px) the burger menu takes over. */}
          <NavLinks />
          <CartWidget />
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
