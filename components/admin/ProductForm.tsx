"use client";

import { useState } from "react";
import ImageUploadField from "./ImageUploadField";
import { OnlineToggle } from "./ToggleRow";
import type { Product } from "@/lib/products";
import { DIMENSION_FIELDS } from "@/lib/product-details";
import {
  checkboxClass,
  checkboxLabelClass,
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

export type ProductFormValues = {
  title: string;
  subtitle: string;
  description: string;
  showDescription: boolean;
  online: boolean;
  // Measures as typed ("24,5"); parsed and validated by the API.
  heightCm: string;
  widthCm: string;
  lengthCm: string;
  diameterCm: string;
  weightG: string;
  imageUrl: string;
  hoverImageUrl: string;
  priceEuros: string;
  collection: string;
};

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  title: "",
  subtitle: "",
  description: "",
  showDescription: true,
  online: true,
  heightCm: "",
  widthCm: "",
  lengthCm: "",
  diameterCm: "",
  weightG: "",
  imageUrl: "",
  hoverImageUrl: "",
  priceEuros: "",
  collection: "",
};

const measureText = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));

export function productToFormValues(product: Product): ProductFormValues {
  return {
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    showDescription: product.showDescription,
    online: product.online,
    heightCm: measureText(product.heightCm),
    widthCm: measureText(product.widthCm),
    lengthCm: measureText(product.lengthCm),
    diameterCm: measureText(product.diameterCm),
    weightG: measureText(product.weightG),
    imageUrl: product.imageUrl,
    hoverImageUrl: product.hoverImageUrl,
    priceEuros: (product.priceCents / 100).toString().replace(".", ","),
    collection: product.collection,
  };
}

// Shared by "Ajouter une pièce" and each piece's "Modifier" panel, so both
// always offer the same fields.
export default function ProductForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  resetOnSuccess = false,
}: {
  initialValues: ProductFormValues;
  submitLabel: string;
  submittingLabel: string;
  // Resolves to an error message, or null on success.
  onSubmit: (values: ProductFormValues) => Promise<string | null>;
  onCancel?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [form, setForm] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Counts in-flight uploads across both image fields; saving waits for them.
  const [uploads, setUploads] = useState(0);
  const trackUpload = (uploading: boolean) => setUploads((n) => n + (uploading ? 1 : -1));

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(form);
    setSubmitting(false);
    if (result) {
      setError(result);
    } else if (resetOnSuccess) {
      setForm(EMPTY_PRODUCT_FORM);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className={hintClass}>Les champs marqués * sont obligatoires.</p>

      <label className={`mt-4 ${labelClass}`}>
        Titre *
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className={`mt-2 ${inputClass}`}
          placeholder="Vase n° 21"
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Prix en euros *
        <input
          required
          // Text + decimal keypad rather than type="number": phones in French
          // locale type "18,50", which a number input silently rejects.
          type="text"
          inputMode="decimal"
          pattern="[0-9]+([.,][0-9]{1,2})?"
          title="Un montant, par exemple 180 ou 18,50"
          value={form.priceEuros}
          onChange={(e) => set("priceEuros", e.target.value)}
          className={`mt-2 ${inputClass}`}
          placeholder="180"
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Sous-titre
        <input
          value={form.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          className={`mt-2 ${inputClass}`}
          placeholder="Grès — 2026"
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Collection
        <input
          value={form.collection}
          onChange={(e) => set("collection", e.target.value)}
          className={`mt-2 ${inputClass}`}
          placeholder="Grès"
        />
      </label>

      <label className={`mt-4 ${labelClass}`}>
        Description
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          className={`mt-2 ${inputClass} resize-y`}
        />
      </label>
      <label className={`mt-2 ${checkboxLabelClass}`}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={form.showDescription}
          onChange={(e) => set("showDescription", e.target.checked)}
        />
        Afficher la description sur les cartes (boutique et Vitrine)
      </label>
      <p className={`mt-2 ${hintClass}`}>Elle reste toujours visible sur la page de la pièce.</p>

      <fieldset className="mt-4">
        <legend className={labelClass}>Dimensions et poids (facultatif)</legend>
        <p className={`mt-2 ${hintClass}`}>
          Remplissez seulement ce qui s&rsquo;applique : un vase a une hauteur et un diamètre, un
          plat un diamètre, un plateau une longueur et une largeur.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          {DIMENSION_FIELDS.map(({ key, label }) => (
            <label key={key} className={labelClass}>
              {label} (cm)
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]+([.,][0-9])?"
                title="Un nombre, par exemple 24 ou 24,5"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
          ))}
          <label className={labelClass}>
            Poids (g)
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]+([.,][0-9])?"
              title="Un nombre de grammes, par exemple 850"
              value={form.weightG}
              onChange={(e) => set("weightG", e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </label>
        </div>
      </fieldset>

      <ImageUploadField
        folder="product-images"
        label="Image principale"
        hint="Affichée par défaut sur le site."
        value={form.imageUrl}
        onChange={(v) => set("imageUrl", v)}
        onUploadingChange={trackUpload}
      />
      <ImageUploadField
        folder="product-images"
        label="Image au survol (facultative)"
        hint="Apparaît en fondu quand on passe la souris sur la pièce."
        value={form.hoverImageUrl}
        onChange={(v) => set("hoverImageUrl", v)}
        onUploadingChange={trackUpload}
      />

      <div className="mt-4">
        <p className={labelClass}>Visibilité</p>
        <div className="mt-2">
          <OnlineToggle online={form.online} onChange={(online) => set("online", online)} />
        </div>
      </div>

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={submitting || uploads > 0}
          className={`flex-1 ${primaryButtonClass}`}
        >
          {uploads > 0 ? "Téléversement en cours…" : submitting ? submittingLabel : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} disabled={submitting} className={secondaryButtonClass}>
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}
