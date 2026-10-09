// Pure (no storage imports) so the admin's live preview and the public
// homepage compute the exact same look from the same numbers.

export type HomeBackground = {
  imageUrl: string;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  // Opacity of the light canvas-colored veil that keeps the hero text legible.
  veil: number;
  // Opacity of the photo itself; below 100 it fades into the light page.
  imageOpacity: number;
  // Opacity of the Vitrine section's light background, under the hero:
  // below 100 the fixed hero photo shows through behind the pieces.
  vitrineOpacity: number;
};

export const DEFAULT_HOME_BACKGROUND: HomeBackground = {
  imageUrl: "/images/1000031199.jpg",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  veil: 60,
  imageOpacity: 100,
  vitrineOpacity: 100,
};

export const HOME_BACKGROUND_FILTERS: {
  key: Exclude<keyof HomeBackground, "imageUrl">;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  { key: "brightness", label: "Luminosité", hint: "100 % = d’origine", min: 0, max: 200 },
  { key: "contrast", label: "Contraste", hint: "100 % = d’origine", min: 0, max: 200 },
  { key: "saturation", label: "Saturation", hint: "0 % = sans couleur, 100 % = d’origine", min: 0, max: 200 },
  { key: "grayscale", label: "Noir et blanc", hint: "0 % = aucun effet", min: 0, max: 100 },
  { key: "sepia", label: "Sépia", hint: "0 % = aucun effet", min: 0, max: 100 },
  { key: "veil", label: "Voile clair", hint: "Éclaircit l’image pour que le texte reste lisible", min: 0, max: 100 },
  { key: "imageOpacity", label: "Opacité de l’image", hint: "100 % = image pleine ; plus bas, elle s’efface dans le fond clair", min: 0, max: 100 },
  // Min 30: titles and prices of the pieces must stay readable over the photo.
  { key: "vitrineOpacity", label: "Opacité du fond de la Vitrine", hint: "100 % = fond clair plein ; plus bas, l’image d’accueil apparaît derrière les pièces", min: 30, max: 100 },
];

export function homeBackgroundFilter(bg: HomeBackground): string {
  return [
    `brightness(${bg.brightness}%)`,
    `contrast(${bg.contrast}%)`,
    `saturate(${bg.saturation}%)`,
    `grayscale(${bg.grayscale}%)`,
    `sepia(${bg.sepia}%)`,
  ].join(" ");
}

// Validates untrusted input (admin request body or stored JSON) into a
// complete HomeBackground: unknown keys dropped, numbers clamped to range.
export function normalizeHomeBackground(input: unknown): HomeBackground {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const result = { ...DEFAULT_HOME_BACKGROUND };

  if (typeof raw.imageUrl === "string" && isAllowedImageUrl(raw.imageUrl.trim())) {
    result.imageUrl = raw.imageUrl.trim();
  }
  for (const { key, min, max } of HOME_BACKGROUND_FILTERS) {
    const value = Number(raw[key]);
    if (raw[key] !== undefined && raw[key] !== "" && Number.isFinite(value)) {
      result[key] = Math.min(max, Math.max(min, Math.round(value)));
    }
  }
  return result;
}

function isAllowedImageUrl(url: string) {
  return url.startsWith("https://") || url.startsWith("/images/");
}
