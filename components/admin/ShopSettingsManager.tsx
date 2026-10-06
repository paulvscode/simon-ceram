"use client";

import { useState } from "react";
import type { ShopSettings } from "@/lib/shop-settings";
import {
  cardClass,
  checkboxClass,
  checkboxLabelClass,
  errorClass,
  hintClass,
  sectionTitleClass,
} from "./ui";

const OPTIONS: [keyof ShopSettings, string][] = [
  ["showAvailability", "Disponibilité (disponible / vendu)"],
  ["showCollections", "Collection"],
  ["showPriceRange", "Prix (min / max)"],
];

export default function ShopSettingsManager({ initialSettings }: { initialSettings: ShopSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sends the whole object (not just the toggled key) and locks the inputs
  // until the save lands, so this panel's state is always what gets stored.
  async function handleToggle(key: keyof ShopSettings) {
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSaving(true);
    setError(null);
    setSettings(next);

    const res = await fetch("/api/shop-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });

    setSaving(false);
    if (!res.ok) {
      setSettings(previous);
      setError("L’enregistrement a échoué. Réessayez.");
    }
  }

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Filtres de la page Shop</h2>
      <p className={`mt-2 ${hintClass}`}>
        Cochez les filtres à proposer aux visiteurs. Les changements sont enregistrés
        immédiatement.
      </p>

      <div className="mt-4 flex flex-col md:gap-2">
        {OPTIONS.map(([key, label]) => (
          <label key={key} className={checkboxLabelClass}>
            <input
              type="checkbox"
              className={checkboxClass}
              checked={settings[key]}
              disabled={saving}
              onChange={() => handleToggle(key)}
            />
            {label}
          </label>
        ))}
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
    </section>
  );
}
