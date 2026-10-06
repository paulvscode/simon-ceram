"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import type { Keyword } from "@/lib/keywords";
import { formatEuros } from "@/lib/format";
import ToggleRow, { OnlineToggle } from "./ToggleRow";
import ProductForm, { productToFormValues, type ProductFormValues } from "./ProductForm";
import {
  cardClass,
  checkboxClass,
  checkboxLabelClass,
  dangerButtonClass,
  errorClass,
  hintClass,
  secondaryButtonClass,
  sectionTitleClass,
} from "./ui";

export default function ProductRow({
  product,
  keywords,
  saving,
  error,
  onToggleDescription,
  onToggleOnline,
  featured,
  featuredDisabled,
  onToggleFeatured,
  onToggleKeyword,
  onEdit,
  onDelete,
}: {
  product: Product;
  keywords: Keyword[];
  saving: boolean;
  error: string | null;
  onToggleDescription: () => void;
  onToggleOnline: (online: boolean) => void;
  // Tagged with the permanent Vitrine keyword (see lib/vitrine.ts).
  featured: boolean;
  featuredDisabled: boolean;
  onToggleFeatured: (featured: boolean) => void;
  onToggleKeyword: (keywordId: string) => void;
  // Resolves to an error message, or null on success.
  onEdit: (values: ProductFormValues) => Promise<string | null>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className={`${cardClass} border-ink/40`}>
        <h3 className={sectionTitleClass}>Modifier « {product.title} »</h3>
        <div className="mt-2">
          <ProductForm
            initialValues={productToFormValues(product)}
            submitLabel="Enregistrer les modifications"
            submittingLabel="Enregistrement…"
            onSubmit={async (values) => {
              const result = await onEdit(values);
              if (!result) setEditing(false);
              return result;
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </li>
    );
  }

  const details = [product.subtitle, product.collection].filter(Boolean).join(" · ");

  return (
    <li className={`${cardClass} ${product.online ? "" : "border-dashed bg-ink/[0.02]"}`}>
      {/* First on the card: the two most-used controls, full width. */}
      <div className="mb-4 flex flex-col gap-2">
        <OnlineToggle online={product.online} disabled={saving} onChange={onToggleOnline} />
        <ToggleRow
          checked={featured}
          onChange={onToggleFeatured}
          disabled={saving || featuredDisabled}
          tone="ink"
          label="Afficher sur la page d’accueil"
          onTitle="Page d’accueil"
          offTitle="Pas sur la page d’accueil"
          onHint={product.online ? "Dans la « Vitrine » de l’accueil" : "Apparaîtra sur l’accueil une fois en ligne"}
          offHint="Visible seulement dans la boutique"
        />
      </div>
      {/* Phones: buttons drop to their own full-width row under the title. */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex min-w-0 flex-1 gap-4">
        <div className={`flex shrink-0 gap-2 ${product.online ? "" : "opacity-40 grayscale"}`}>
          <div className="h-16 w-16 overflow-hidden rounded bg-ink/5">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          {product.hoverImageUrl ? (
            <div
              className="h-16 w-16 overflow-hidden rounded bg-ink/5"
              title="Image au survol"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.hoverImageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-base font-semibold text-ink">{product.title}</p>
            <span
              className={`rounded px-2 text-xs font-medium ${
                product.sold ? "bg-ink/10 text-ink/60" : "bg-green-100 text-green-800"
              }`}
            >
              {product.sold ? "Vendu" : "Disponible"}
            </span>
          </div>
          <p className={`break-words ${hintClass}`}>
            {details ? `${details} · ` : ""}
            {formatEuros(product.priceCents)}
          </p>

        </div>
        </div>

        <div className="flex gap-2 sm:shrink-0 sm:self-start">
          <button
            onClick={() => setEditing(true)}
            disabled={saving}
            className={`flex-1 sm:flex-none ${secondaryButtonClass}`}
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            disabled={saving}
            className={`flex-1 sm:flex-none ${dangerButtonClass}`}
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-4">
        {product.description ? (
          <>
            <label className={checkboxLabelClass}>
              <input
                type="checkbox"
                className={checkboxClass}
                checked={product.showDescription}
                disabled={saving}
                onChange={onToggleDescription}
              />
              Afficher la description sur le site
            </label>
            <p
              className={`mt-2 line-clamp-2 text-sm ${
                product.showDescription ? "text-ink/70" : "text-ink/40"
              }`}
            >
              {product.description}
            </p>
          </>
        ) : (
          <p className={hintClass}>Pas de description pour cette pièce.</p>
        )}
      </div>

      {keywords.length > 0 ? (
        <div className="mt-4 border-t border-ink/10 pt-4">
          <p className="text-sm font-medium text-ink">Mots-clés</p>
          <div className="mt-2 flex flex-wrap gap-x-4 md:gap-y-2">
            {keywords.map((keyword) => (
              <label key={keyword.id} className={checkboxLabelClass}>
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={product.keywords.includes(keyword.id)}
                  disabled={saving}
                  onChange={() => onToggleKeyword(keyword.id)}
                />
                {keyword.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className={`mt-4 ${errorClass}`}>{error}</p> : null}
    </li>
  );
}
