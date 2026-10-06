import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";

export type Keyword = {
  id: string;
  label: string;
};

// Cached read; changes are fresh read-modify-writes (see lib/json-store.ts).
async function readAll(): Promise<Keyword[]> {
  return (await readDocument<Keyword[]>("keywords")) ?? [];
}

export async function getKeywords(): Promise<Keyword[]> {
  const keywords = await readAll();
  return [...keywords].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export async function createKeyword(label: string): Promise<Keyword> {
  const trimmed = label.trim();
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
  await updateDocument<Keyword[]>("keywords", [], (keywords) =>
    keywords.map((k) => (k.id === id ? { ...k, label: label.trim() } : k))
  );
}

export async function deleteKeyword(id: string): Promise<void> {
  await updateDocument<Keyword[]>("keywords", [], (keywords) => keywords.filter((k) => k.id !== id));
}
