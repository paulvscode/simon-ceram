export default function Footer() {
  return (
    <footer id="contact" className="grid-container py-16">
      <div className="grid-matrix items-end font-sans text-[11px] uppercase tracking-widest text-ink/40">
        <div className="md:col-span-4">
          <p>Atelier Simon</p>
          <p className="mt-2">12 rue des Tanneurs, Dieulefit</p>
        </div>
        <div className="mt-8 md:col-start-6 md:col-span-3 md:mt-0">
          <p>Contact</p>
          <p className="mt-2">atelier@simon-ceramique.fr</p>
        </div>
        <div className="mt-8 md:col-start-10 md:col-span-3 md:mt-0 md:text-right">
          <p>&copy; {new Date().getFullYear()} Simon Céramique</p>
        </div>
      </div>
    </footer>
  );
}
