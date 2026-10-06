import { randomUUID } from "crypto";
import { readDocument, updateDocument } from "@/lib/json-store";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
};

// Cached read; new messages are fresh read-modify-writes (see lib/json-store.ts).
export async function getContactMessages(): Promise<ContactMessage[]> {
  const messages = (await readDocument<ContactMessage[]>("contact-messages")) ?? [];
  return [...messages].sort((a, b) => b.createdAt - a.createdAt);
}

export type NewContactMessage = {
  name: string;
  email: string;
  message: string;
};

export async function createContactMessage(
  input: NewContactMessage
): Promise<ContactMessage> {
  const message: ContactMessage = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: Date.now(),
  };
  await updateDocument<ContactMessage[]>("contact-messages", [], (messages) => [...messages, message]);
  return message;
}
