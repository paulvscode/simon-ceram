import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import Footer from "@/components/Footer";
import { getHeroText, getHomeBackground } from "@/lib/site-content";

export const dynamic = "force-dynamic";

// Landing page kept deliberately bare: menu, hero (image + phrase), footer.
// The Vitrine, the shop call-to-action and the process now have their own
// pages (/vitrine, /processus), reached from the menu.
export default async function HomePage() {
  const [background, hero] = await Promise.all([getHomeBackground(), getHeroText()]);

  return (
    <>
      <HeroBackground background={background} />
      <main className="relative z-10">
        <Nav />
        <Hero hero={hero} />
        <Footer />
      </main>
    </>
  );
}
