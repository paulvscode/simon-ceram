import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import HeroBackground from "@/components/HeroBackground";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <HeroBackground />
      <main className="relative z-10">
        <Nav />
        <Hero />
        <Footer />
      </main>
    </>
  );
}
