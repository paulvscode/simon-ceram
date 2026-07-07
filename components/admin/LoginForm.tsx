"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Une erreur est survenue.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="md:col-start-4 md:col-span-6 lg:col-start-5 lg:col-span-4">
      <label className="block font-sans text-[11px] uppercase tracking-widest text-ink/50">
        Mot de passe administrateur
      </label>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-4 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-serif text-xl text-ink outline-none focus:border-ink"
      />
      {error ? (
        <p className="mt-4 font-sans text-[11px] uppercase tracking-widest text-ink/60">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-8 font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4 disabled:text-ink/40"
      >
        {submitting ? "Vérification…" : "Entrer"}
      </button>
    </form>
  );
}
