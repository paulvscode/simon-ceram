"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { cardClass, hintClass, primaryButtonClass, sectionTitleClass } from "@/components/admin/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // Refetch the failed server render before resetting (see app/error.tsx).
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="min-h-screen bg-ink/[0.03] font-ui">
      <div className="grid-container py-24">
        <div className="grid-matrix">
          <div className={`${cardClass} md:col-start-3 md:col-span-8 lg:col-start-4 lg:col-span-6`}>
            <h1 className={sectionTitleClass}>Les données n&rsquo;ont pas pu être chargées</h1>
            <p className={`mt-2 ${hintClass}`}>
              Le stockage du site ne répond pas pour le moment. Vos pièces et vos commandes ne
              sont pas perdues : réessayez dans quelques minutes. Si le problème dure, le
              service de stockage (Upstash) a peut-être atteint la limite de son forfait gratuit.
            </p>
            <button onClick={retry} className={`mt-4 w-full sm:w-auto ${primaryButtonClass}`}>
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
