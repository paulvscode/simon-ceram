import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { formatEuros } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let email: string | undefined;
  let total: number | undefined;

  if (session_id && isStripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      email = session.customer_details?.email ?? undefined;
      total = session.amount_total ?? undefined;
    } catch {
      // Session lookup failed — still show a generic confirmation below.
    }
  }

  return (
    <main>
      <Nav />
      <section className="grid-container py-24 md:py-48">
        <div className="grid-matrix">
          <div className="md:col-start-3 md:col-span-8 lg:col-start-4 lg:col-span-6">
            <h1 className="font-serif text-3xl tracking-wide">Merci pour votre commande</h1>
            <p className="mt-8 font-sans text-sm leading-relaxed text-ink/70">
              {email
                ? `Un e-mail de confirmation a été envoyé à ${email}.`
                : "Un e-mail de confirmation vous a été envoyé."}{" "}
              L&rsquo;atelier prépare votre pièce avec soin avant expédition.
            </p>
            {total ? (
              <p className="mt-8 font-serif text-xl">{formatEuros(total)}</p>
            ) : null}
            <a
              href="/"
              className="mt-8 inline-block font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4"
            >
              Retour à l&rsquo;accueil
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
