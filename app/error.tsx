"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Public error page: shown when a page can't load its data (e.g. storage
 * unavailable) instead of Next's raw error screen.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // A server render failed: refetch it (refresh) before resetting the boundary,
  // otherwise "Réessayer" would just re-show the same error.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <main className="grid-container flex min-h-screen items-center py-16">
      <div className="grid-matrix w-full">
        <div className="md:col-span-7">
          <p className="font-sans text-[11px] uppercase tracking-widest text-ink/50">
            Simon Barraud de Lagerie
          </p>
          <h1 className="mt-8 font-sans text-3xl italic leading-snug tracking-wide text-ink md:text-4xl">
            Le site est momentanément indisponible.
          </h1>
          <p className="mt-8 font-sans text-sm leading-relaxed text-ink/70">
            Les pièces n&rsquo;ont pas pu être chargées. Réessayez dans quelques instants.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            <button
              onClick={retry}
              className="bg-ink px-8 py-4 font-sans text-[11px] uppercase tracking-widest text-canvas hover:bg-ink/80"
            >
              Réessayer
            </button>
            <a
              href="mailto:atelier@simon-ceramique.fr"
              className="self-center font-sans text-[11px] uppercase tracking-widest text-ink underline underline-offset-4"
            >
              Écrire à l&rsquo;atelier
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
