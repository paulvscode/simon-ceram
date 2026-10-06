// Pure (no storage imports): shared by the admin editor and the homepage.

export type ProcessStep = {
  title: string;
  text: string;
};

export type ProcessSection = {
  label: string;
  title: string;
  intro: string;
  imageUrl: string;
  imageAlt: string;
  steps: ProcessStep[];
};

export const MAX_PROCESS_STEPS = 8;

const LIMITS = { label: 60, title: 160, intro: 1200, imageAlt: 160, stepTitle: 80, stepText: 800 };

// Starting copy, drawn from what the Atelier page already says about the
// wood kiln; the atelier is expected to rewrite it from the admin.
export const DEFAULT_PROCESS_SECTION: ProcessSection = {
  label: "Le processus",
  title: "Du four à bois à la pièce : dix-huit heures de feu, surveillé en continu.",
  intro:
    "Chaque pièce passe par le même chemin, de l’enfournement au défournement. La flamme n’est pas un outil qu’on maîtrise entièrement — elle laisse sa propre marque sur chaque pièce.",
  imageUrl: "/images/hero.jpg",
  imageAlt: "L’atelier de Simon, à Dieulefit",
  steps: [
    {
      title: "L’enfournement",
      text: "Les pièces sèches sont disposées une à une dans le four. Leur place décide de la façon dont la flamme et les cendres les traverseront.",
    },
    {
      title: "L’allumage",
      text: "Le feu est allumé doucement, puis nourri au bois, bûche après bûche, pour faire monter le four lentement en température.",
    },
    {
      title: "La cuisson",
      text: "Le four brûle dix-huit heures d’affilée, surveillé en continu. Les cendres du foyer se déposent sur les pièces et deviennent parfois la glaçure elle-même.",
    },
    {
      title: "Le défournement",
      text: "Après le refroidissement, le four est ouvert : chaque pièce est découverte pour la première fois, telle que le feu l’a laissée.",
    },
  ],
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAllowedImageUrl(url: string) {
  return url === "" || url.startsWith("https://") || url.startsWith("/images/");
}

// Validates untrusted input into a complete section: strings trimmed and
// length-capped, empty steps dropped, at most MAX_PROCESS_STEPS kept.
export function normalizeProcessSection(input: unknown): ProcessSection {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const imageUrl = text(raw.imageUrl, 2048);

  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((step) => {
      const s = (step && typeof step === "object" ? step : {}) as Record<string, unknown>;
      return { title: text(s.title, LIMITS.stepTitle), text: text(s.text, LIMITS.stepText) };
    })
    .filter((step) => step.title || step.text)
    .slice(0, MAX_PROCESS_STEPS);

  return {
    label: text(raw.label, LIMITS.label),
    title: text(raw.title, LIMITS.title),
    intro: text(raw.intro, LIMITS.intro),
    imageUrl: isAllowedImageUrl(imageUrl) ? imageUrl : "",
    imageAlt: text(raw.imageAlt, LIMITS.imageAlt),
    steps,
  };
}
