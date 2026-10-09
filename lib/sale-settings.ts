// Seller identity and selling rules, edited in the admin ("Vente" tab).
// Client-safe: used by the admin form, the cart, product pages, the CGV
// page and the invoices.

export type VatRegime = "franchise" | "assujetti";

export type SaleSettings = {
  // Seller, as printed on invoices and the CGV.
  sellerName: string;
  legalForm: string;
  address: string;
  siret: string;
  email: string;
  phone: string;
  // VAT: "franchise" = micro-entrepreneur under the threshold (no VAT).
  vatRegime: VatRegime;
  vatRate: number; // %, when "assujetti"
  vatNumber: string;
  // Consumer mediator (required for selling online to consumers in France).
  mediatorName: string;
  mediatorUrl: string;
  mediatorAddress: string;
  // Shown in the cart, above the payment button.
  shippingPolicy: string;
};

export const DEFAULT_SALE_SETTINGS: SaleSettings = {
  sellerName: "Simon Barraud de Lagerie",
  legalForm: "",
  address: "12 rue des Tanneurs, Dieulefit",
  siret: "",
  email: "atelier@simon-ceramique.fr",
  phone: "",
  vatRegime: "franchise",
  vatRate: 20,
  vatNumber: "",
  mediatorName: "",
  mediatorUrl: "",
  mediatorAddress: "",
  shippingPolicy:
    "Chaque pièce est emballée à la main avec soin et expédiée en envoi suivi et assuré. Si une pièce arrive cassée, envoyez-nous une photo du colis et de la pièce sous 48 heures : nous vous la remboursons intégralement.",
};

const LIMITS: Record<keyof SaleSettings, number> = {
  sellerName: 120,
  legalForm: 120,
  address: 240,
  siret: 20,
  email: 120,
  phone: 40,
  vatRegime: 20,
  vatRate: 5,
  vatNumber: 20,
  mediatorName: 160,
  mediatorUrl: 300,
  mediatorAddress: 240,
  shippingPolicy: 1200,
};

export function normalizeSaleSettings(input: unknown): SaleSettings {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const text = (key: keyof SaleSettings) =>
    typeof raw[key] === "string" ? (raw[key] as string).trim().slice(0, LIMITS[key]) : (DEFAULT_SALE_SETTINGS[key] as string);
  const rate = Number(raw.vatRate);
  const url = text("mediatorUrl");
  return {
    sellerName: text("sellerName"),
    legalForm: text("legalForm"),
    address: text("address"),
    siret: text("siret"),
    email: text("email"),
    phone: text("phone"),
    vatRegime: raw.vatRegime === "assujetti" ? "assujetti" : "franchise",
    vatRate: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : DEFAULT_SALE_SETTINGS.vatRate,
    vatNumber: text("vatNumber"),
    mediatorName: text("mediatorName"),
    // Only real web addresses (rendered as a link on the CGV page).
    mediatorUrl: !url || /^https?:\/\//i.test(url) ? url : `https://${url}`,
    mediatorAddress: text("mediatorAddress"),
    shippingPolicy: text("shippingPolicy"),
  };
}

/** The price mention required next to prices. */
export function vatMention(s: Pick<SaleSettings, "vatRegime">): string {
  return s.vatRegime === "franchise" ? "TVA non applicable, art. 293 B du CGI" : "Prix TTC, TVA incluse";
}

/** What still needs filling in before selling (admin checklist). */
export function missingSaleFields(s: SaleSettings): string[] {
  const missing: string[] = [];
  if (!s.legalForm) missing.push("Forme juridique");
  if (!s.siret) missing.push("SIRET");
  if (!s.address) missing.push("Adresse");
  if (s.vatRegime === "assujetti" && !s.vatNumber) missing.push("N° de TVA intracommunautaire");
  if (!s.mediatorName || !s.mediatorUrl) missing.push("Médiateur de la consommation");
  return missing;
}
