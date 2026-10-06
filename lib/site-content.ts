import { readDocument, writeDocument, type DocumentKey } from "@/lib/json-store";
import {
  DEFAULT_HOME_BACKGROUND,
  normalizeHomeBackground,
  type HomeBackground,
} from "@/lib/home-background";
import { sanitizeLegalHtml } from "@/lib/legal-html";
import {
  DEFAULT_PROCESS_SECTION,
  normalizeProcessSection,
  type ProcessSection,
} from "@/lib/process-section";

// Site texts and images are cosmetic: if storage fails, render the defaults
// (and log) rather than taking the whole page down.
async function readOrDefault<T>(key: DocumentKey, normalize: (stored: unknown) => T, fallback: T): Promise<T> {
  try {
    const stored = await readDocument<unknown>(key);
    return stored ? normalize(stored) : fallback;
  } catch (error) {
    console.error(`site-content (${key}):`, error);
    return fallback;
  }
}

// ---- Homepage background ----

export async function getHomeBackground(): Promise<HomeBackground> {
  return readOrDefault("home-background", normalizeHomeBackground, DEFAULT_HOME_BACKGROUND);
}

export async function saveHomeBackground(input: unknown): Promise<HomeBackground> {
  const background = normalizeHomeBackground(input);
  await writeDocument("home-background", background);
  return background;
}

// ---- Mentions légales ----

export type LegalPage = {
  html: string;
  updatedAt: number | null;
};

export async function getLegalPage(): Promise<LegalPage> {
  return readOrDefault<LegalPage>(
    "legal",
    (stored) => {
      const page = stored as Partial<LegalPage>;
      return { html: sanitizeLegalHtml(page.html ?? ""), updatedAt: page.updatedAt ?? null };
    },
    { html: "", updatedAt: null }
  );
}

export async function saveLegalPage(html: string): Promise<LegalPage> {
  const page = { html: sanitizeLegalHtml(html), updatedAt: Date.now() };
  await writeDocument("legal", page);
  return page;
}

// ---- Homepage "process" section ----

export async function getProcessSection(): Promise<ProcessSection> {
  return readOrDefault("process-section", normalizeProcessSection, DEFAULT_PROCESS_SECTION);
}

export async function saveProcessSection(input: unknown): Promise<ProcessSection> {
  const section = normalizeProcessSection(input);
  await writeDocument("process-section", section);
  return section;
}
