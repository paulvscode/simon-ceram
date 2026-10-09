import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProcessHero from "@/components/ProcessHero";
import { getProcessSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Processus — Simon Barraud de Lagerie" };

// Content edited in the admin (Site tab → Section « processus »).
export default async function ProcessusPage() {
  const section = await getProcessSection();
  return (
    <main>
      <Nav />
      <ProcessHero section={section} />
      <Footer />
    </main>
  );
}
