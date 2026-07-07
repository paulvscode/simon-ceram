import { randomUUID } from "crypto";
import { list, put } from "@vercel/blob";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
};

const BLOB_PATHNAME = "contact-messages.json";

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  return blobs.find((b) => b.pathname === BLOB_PATHNAME)?.url ?? null;
}

async function writeAll(messages: ContactMessage[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(messages, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readAll(): Promise<ContactMessage[]> {
  const url = await findBlobUrl();
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  return (await res.json()) as ContactMessage[];
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const messages = await readAll();
  return messages.sort((a, b) => b.createdAt - a.createdAt);
}

export type NewContactMessage = {
  name: string;
  email: string;
  message: string;
};

export async function createContactMessage(
  input: NewContactMessage
): Promise<ContactMessage> {
  const messages = await readAll();
  const message: ContactMessage = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: Date.now(),
  };
  messages.push(message);
  await writeAll(messages);
  return message;
}
