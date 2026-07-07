import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SECTIONS = [
  {
    number: "01",
    title: "Le geste",
    body: "Chaque pièce commence sur le tour, centrée à la main jusqu'à ce que la terre cesse de résister. Les parois montent lentement, reprises encore et encore, jusqu'à trouver leur épaisseur juste. Rien n'est mesuré à l'avance — la forme se décide en tournant.",
  },
  {
    number: "02",
    title: "La matière",
    body: "Le grès, dense et patient, tolère l'erreur et garde la trace du geste. La porcelaine, plus fine et plus franche, ne pardonne rien et impose sa propre discipline. Les deux viennent de la même terre, travaillées différemment selon ce qu'elles doivent devenir.",
  },
  {
    number: "03",
    title: "La cuisson",
    body: "Le four à bois brûle dix-huit heures d'affilée, surveillé en continu. La flamme n'est pas un outil qu'on maîtrise entièrement — elle laisse sa propre marque sur chaque pièce. Les cendres du foyer, tamisées et mises en suspension, deviennent parfois la glaze elle-même.",
  },
  {
    number: "04",
    title: "Le savoir-faire",
    body: "Un geste qui se transmet et se répète, affiné pièce après pièce plutôt qu'appris d'un seul coup. Dieulefit porte cette tradition depuis des générations — une terre à argile, un four, et le temps qu'il faut pour bien faire les choses.",
  },
];

export default function AtelierPage() {
  return (
    <main>
      <Nav />

      <section className="grid-container py-24 md:py-32">
        <div className="grid-matrix">
          <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50 md:col-span-12">
            Simon — céramiste, Dieulefit
          </p>
          <h1 className="mt-8 font-serif text-3xl italic leading-snug tracking-wide text-ink md:col-span-8 md:text-4xl lg:text-5xl">
            La forme suit la lenteur. Rien ici ne se presse — ni la terre, ni le feu, ni la main.
          </h1>
        </div>
      </section>

      <div className="relative h-[50vh] w-full md:h-[70vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero.jpg"
          alt="L'atelier de Simon, à Dieulefit"
          className="h-full w-full object-cover"
        />
      </div>

      {SECTIONS.map((section) => (
        <div key={section.number} className="grid-container border-t border-ink/10 py-16 md:py-24">
          <div className="grid-matrix">
            <p className="font-sans text-[11px] uppercase tracking-widest text-ink/40 md:col-span-2">
              {section.number}
            </p>
            <h2 className="mt-4 font-serif text-2xl tracking-wide text-ink md:col-start-3 md:col-span-3 md:mt-0">
              {section.title}
            </h2>
            <p className="mt-4 font-sans text-sm leading-relaxed text-ink/70 md:col-start-7 md:col-span-5 md:mt-0">
              {section.body}
            </p>
          </div>
        </div>
      ))}

      <Footer />
    </main>
  );
}
