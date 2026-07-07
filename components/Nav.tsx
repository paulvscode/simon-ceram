import CartWidget from "./CartWidget";

const LINKS = [
  { label: "Atelier", href: "/atelier" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  return (
    <header className="grid-container py-8">
      <nav className="flex items-center justify-between">
        <a href="/" className="font-serif text-lg tracking-wide">
          Simon Céramique
        </a>
        <ul className="flex items-center gap-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-sans text-[11px] uppercase tracking-widest text-ink/70 transition-colors duration-400 hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <CartWidget />
          </li>
        </ul>
      </nav>
    </header>
  );
}
