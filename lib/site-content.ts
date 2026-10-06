import { readLatestJson, writeJsonVersion } from "@/lib/blob-json";
import {
  DEFAULT_HOME_BACKGROUND,
  normalizeHomeBackground,
  type HomeBackground,
} from "@/lib/home-background";
import { sanitizeLegalHtml } from "@/lib/legal-html";

// ---- Homepage background ----

const HOME_BACKGROUND_PREFIX = "home-background/";

export async function getHomeBackground(): Promise<HomeBackground> {
  const stored = await readLatestJson<unknown>(HOME_BACKGROUND_PREFIX);
  return stored ? normalizeHomeBackground(stored) : DEFAULT_HOME_BACKGROUND;
}

export async function saveHomeBackground(input: unknown): Promise<HomeBackground> {
  const background = normalizeHomeBackground(input);
  await writeJsonVersion(HOME_BACKGROUND_PREFIX, "home-background.json", background);
  return background;
}

// ---- Mentions légales ----

export type LegalPage = {
  html: string;
  updatedAt: number | null;
};

const LEGAL_PREFIX = "legal/";

export async function getLegalPage(): Promise<LegalPage> {
  const stored = await readLatestJson<LegalPage>(LEGAL_PREFIX);
  if (!stored) return { html: "", updatedAt: null };
  return { html: sanitizeLegalHtml(stored.html ?? ""), updatedAt: stored.updatedAt ?? null };
}

export async function saveLegalPage(html: string): Promise<LegalPage> {
  const page = { html: sanitizeLegalHtml(html), updatedAt: Date.now() };
  await writeJsonVersion(LEGAL_PREFIX, "legal.json", page);
  return page;
}
