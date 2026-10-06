"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cardClass, errorClass, hintClass, inputClass, labelClass, primaryButtonClass } from "./ui";

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
    <form
      onSubmit={handleSubmit}
      className={`${cardClass} md:col-start-4 md:col-span-6 lg:col-start-5 lg:col-span-4`}
    >
      <h1 className="text-xl font-semibold text-ink">Administration</h1>
      <p className={`mt-2 ${hintClass}`}>Accès réservé à l&rsquo;atelier.</p>

      <label className={`mt-4 ${labelClass}`}>
        Mot de passe
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-2 ${inputClass}`}
        />
      </label>
      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      <button
        type="submit"
        disabled={submitting || !password}
        className={`mt-4 w-full ${primaryButtonClass}`}
      >
        {submitting ? "Vérification…" : "Se connecter"}
      </button>
    </form>
  );
}
