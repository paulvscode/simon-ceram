"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const inputClass =
  "mt-2 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-lg text-ink outline-none focus:border-ink";
const labelClass = "font-sans text-[11px] uppercase tracking-widest text-ink/50";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Impossible d'envoyer le message.");
      return;
    }

    setSent(true);
  }

  return (
    <main>
      <Nav />
      <section className="grid-container py-24 md:py-32">
        <div className="grid-matrix">
          <div className="md:col-span-6">
            <h1 className="font-serif text-3xl tracking-wide">Contact</h1>
            <p className="mt-4 font-sans text-sm leading-relaxed text-ink/70">
              Une question sur une pièce, une commande, ou une demande particulière ?
              Écrivez-nous ci-dessous — nous répondons personnellement à chaque message.
            </p>
          </div>
        </div>

        <div className="grid-matrix mt-16">
          <div className="md:col-span-6">
            {sent ? (
              <p className={labelClass}>
                Merci, votre message a bien été envoyé. Nous vous répondrons rapidement.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <label className={`block ${labelClass}`}>Nom</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />

                <label className={`mt-8 block ${labelClass}`}>E-mail</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />

                <label className={`mt-8 block ${labelClass}`}>Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  className={`${inputClass} resize-none`}
                />

                {error ? <p className={`mt-4 ${labelClass}`}>{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
                >
                  {submitting ? "Envoi…" : "Envoyer"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
