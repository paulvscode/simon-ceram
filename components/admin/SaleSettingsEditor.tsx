"use client";

import { useState } from "react";
import { missingSaleFields, vatMention, type SaleSettings } from "@/lib/sale-settings";
import {
  cardClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

type Field = { key: keyof SaleSettings; label: string; placeholder?: string; hint?: string };

const SELLER_FIELDS: Field[] = [
  { key: "sellerName", label: "Nom ou raison sociale" },
  { key: "legalForm", label: "Forme juridique", placeholder: "Entreprise individuelle (micro-entreprise)" },
  { key: "address", label: "Adresse complète", placeholder: "12 rue des Tanneurs, 26220 Dieulefit" },
  { key: "siret", label: "SIRET", placeholder: "123 456 789 00012" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Téléphone (facultatif)" },
];

const MEDIATOR_FIELDS: Field[] = [
  { key: "mediatorName", label: "Nom du médiateur", placeholder: "Ex. CM2C, Médicys…" },
  { key: "mediatorUrl", label: "Site web du médiateur", placeholder: "https://…" },
  { key: "mediatorAddress", label: "Adresse postale (facultative)" },
];

function CheckItem({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span
        aria-hidden="true"
        className={`mt-[2px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          done ? "bg-green-700" : "bg-amber-500"
        }`}
      >
        {done ? "✓" : "!"}
      </span>
      <span className={done ? "text-ink/60" : "text-ink"}>
        <span className="sr-only">{done ? "Fait : " : "À faire : "}</span>
        {children}
      </span>
    </li>
  );
}

/**
 * The "Vente" tab's settings: a checklist of what's left before opening
 * sales, then the seller's identity, VAT, consumer mediator and shipping
 * policy — one document, one save button.
 */
export default function SaleSettingsEditor({
  initialSettings,
  stripeMode,
  webhookConfigured,
  cgvSaved,
}: {
  initialSettings: SaleSettings;
  stripeMode: "live" | "test" | "none";
  webhookConfigured: boolean;
  cgvSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSettings);
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const missing = missingSaleFields(saved);

  function set<K extends keyof SaleSettings>(key: K, value: SaleSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setJustSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/site/sale-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError("L’enregistrement a échoué. Vérifiez votre connexion et réessayez.");
      return;
    }
    const { settings } = (await res.json()) as { settings: SaleSettings };
    setForm(settings);
    setSaved(settings);
    setJustSaved(true);
  }

  const input = (f: Field) => (
    <label key={f.key} className={labelClass}>
      {f.label}
      <input
        value={form[f.key] as string}
        onChange={(e) => set(f.key, e.target.value)}
        placeholder={f.placeholder}
        className={`mt-2 ${inputClass}`}
      />
    </label>
  );

  const saveBar = (
    <>
      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
      {justSaved ? (
        <p role="status" className="mt-4 text-sm text-green-800">
          Enregistré. Factures, CGV et panier sont à jour.
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:flex">
        <button onClick={handleSave} disabled={saving || !dirty} className={primaryButtonClass}>
          {saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Aucune modification"}
        </button>
        {dirty ? (
          <button onClick={() => setForm(saved)} className={secondaryButtonClass}>
            Annuler les changements
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Avant d&rsquo;ouvrir la vente</h2>
        <p className={`mt-2 ${hintClass}`}>
          Les points à régler pour vendre en ligne en règle. À faire vérifier par votre comptable
          ou un conseiller juridique.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          <CheckItem done={missing.length === 0}>
            Informations du vendeur et médiateur
            {missing.length ? ` — manque : ${missing.join(", ")}` : ""}
          </CheckItem>
          <CheckItem done={cgvSaved}>
            Conditions générales de vente relues, complétées et enregistrées (carte ci-dessous)
          </CheckItem>
          <CheckItem done={saved.shippingPolicy !== ""}>
            Politique de livraison et de casse
          </CheckItem>
          <CheckItem done={webhookConfigured}>
            Notifications Stripe (webhook) configurées
          </CheckItem>
          <CheckItem done={stripeMode === "live"}>
            Stripe en mode réel
            {stripeMode === "test"
              ? " — actuellement en mode test : aucun vrai paiement n’est encaissé"
              : stripeMode === "none"
                ? " — Stripe n’est pas configuré"
                : ""}
          </CheckItem>
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Vendeur</h2>
        <p className={`mt-2 ${hintClass}`}>
          Imprimé sur chaque facture et en bas des conditions générales de vente.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{SELLER_FIELDS.map(input)}</div>
        {saveBar}
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>TVA</h2>
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="sr-only">Régime de TVA</legend>
          {(
            [
              ["franchise", "Micro-entrepreneur, franchise de TVA", "Prix sans TVA ; mention « TVA non applicable, art. 293 B du CGI »."],
              ["assujetti", "Assujetti à la TVA", "Prix TTC ; la facture détaille HT, TVA et TTC."],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-4 rounded border px-4 py-2 ${
                form.vatRegime === value ? "border-ink bg-ink/[0.04]" : "border-ink/20"
              }`}
            >
              <input
                type="radio"
                name="vatRegime"
                checked={form.vatRegime === value}
                onChange={() => set("vatRegime", value)}
                className="mt-[4px] h-4 w-4 shrink-0 accent-ink"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-xs text-ink/60">{hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {form.vatRegime === "assujetti" ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Taux de TVA (%)
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.vatRate}
                onChange={(e) => set("vatRate", Number(e.target.value))}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            {input({ key: "vatNumber", label: "N° de TVA intracommunautaire", placeholder: "FR12 345678901" })}
          </div>
        ) : null}
        <p className={`mt-4 ${hintClass}`}>
          Affiché sous les prix : « {vatMention(form)} »
        </p>
        {saveBar}
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Médiateur de la consommation</h2>
        <p className={`mt-2 ${hintClass}`}>
          Obligatoire pour vendre en ligne à des particuliers : choisissez un médiateur agréé (liste
          sur economie.gouv.fr, rubrique « médiation de la consommation ») et adhérez-y. Il apparaît
          automatiquement dans les CGV.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4">{MEDIATOR_FIELDS.map(input)}</div>
        {saveBar}
      </section>

      <section className={cardClass}>
        <h2 className={sectionTitleClass}>Livraison et casse</h2>
        <p className={`mt-2 ${hintClass}`}>
          Court texte affiché dans le panier, juste avant le paiement : emballage, envoi assuré, et
          ce qui se passe si une pièce arrive cassée. Le détail va dans les CGV.
        </p>
        <textarea
          value={form.shippingPolicy}
          onChange={(e) => set("shippingPolicy", e.target.value)}
          rows={4}
          maxLength={1200}
          aria-label="Politique de livraison et de casse"
          className={`mt-4 ${inputClass} resize-y`}
        />
        {saveBar}
      </section>
    </div>
  );
}
