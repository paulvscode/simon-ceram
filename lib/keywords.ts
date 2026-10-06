import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";
import { isVitrine, VITRINE_DEFAULT_ID, VITRINE_LABEL } from "@/lib/vitrine";

export type Keyword = {
  id: string;
  label: string;
};

// Thrown when an edit would rename, delete or duplicate the permanent Vitrine
// keyword; API routes turn it into a 400 with this message.
export class PermanentKeywordError extends Error {
  constructor() {
    super("Le mot-clé « Vitrine » est permanent : il ne peut être ni renommé, ni supprimé, ni dupliqué.");
    this.name = "PermanentKeywordError";
  }
}

// Cached read; changes are fresh read-modify-writes (see lib/json-store.ts).
async function readAll(): Promise<Keyword[]> {
  return (await readDocument<Keyword[]>("keywords")) ?? [];
}

// The list always contains Vitrine: the stored "Vitrine"/"Selected Works"
// entry relabelled (its id kept, so existing tags hold), else a built-in one.
function withVitrine(stored: Keyword[]): Keyword[] {
  const existing = stored.find(isVitrine);
  return [
    { id: existing?.id ?? VITRINE_DEFAULT_ID, label: VITRINE_LABEL },
    ...stored.filter((k) => !isVitrine(k)),
  ];
}

export async function getKeywords(): Promise<Keyword[]> {
  return withVitrine(await readAll()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

const isPermanentId = (keywords: Keyword[], id: string) =>
  id === VITRINE_DEFAULT_ID || keywords.some((k) => k.id === id && isVitrine(k));

export async function createKeyword(label: string): Promise<Keyword> {
  const trimmed = label.trim();
  // "Vitrine" (or its former name) already exists, permanently.
  if (isVitrine({ label: trimmed })) return withVitrine(await readAll())[0];

  let result!: Keyword;
  await updateDocument<Keyword[]>("keywords", [], (keywords) => {
    const existing = keywords.find((k) => k.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      result = existing;
      return keywords;
    }
    result = { id: randomUUID(), label: trimmed };
    return [...keywords, result];
  });
  return result;
}

export async function renameKeyword(id: string, label: string): Promise<void> {
  await updateDocument<Keyword[]>("keywords", [], (keywords) => {
    if (isPermanentId(keywords, id) || isVitrine({ label })) throw new PermanentKeywordError();
    return keywords.map((k) => (k.id === id ? { ...k, label: label.trim() } : k));
  });
}

export async function deleteKeyword(id: string): Promise<void> {
  await updateDocument<Keyword[]>("keywords", [], (keywords) => {
    if (isPermanentId(keywords, id)) throw new PermanentKeywordError();
    return keywords.filter((k) => k.id !== id);
  });
}
