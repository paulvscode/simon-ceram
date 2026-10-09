"use client";

import { primaryButtonClass } from "./ui";

// The browser's print dialog also offers "Enregistrer au format PDF".
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className={primaryButtonClass}>
      Imprimer / enregistrer en PDF
    </button>
  );
}
