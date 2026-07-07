export default function Hero() {
  return (
    <section className="grid-container flex min-h-screen items-center py-16">
      <div className="grid-matrix">
        <p className="font-serif text-3xl italic leading-snug tracking-wide text-ink md:col-span-7 md:text-4xl lg:text-5xl">
          La forme suit la lenteur. Chaque pièce naît d&rsquo;un même geste,
          répété jusqu&rsquo;à ce que la matière cesse de résister.
        </p>
        <p className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink/50 md:col-start-1 md:col-span-4">
          Simon — céramiste, atelier de grès et porcelaine
        </p>
      </div>
    </section>
  );
}
