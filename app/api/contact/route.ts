import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createContactMessage, getContactMessages } from "@/lib/contactMessages";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "Une adresse e-mail valide est requise." }, { status: 400 });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Le message est requis." }, { status: 400 });
  }

  await createContactMessage({ name, email, message });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const messages = await getContactMessages();
  return NextResponse.json({ messages });
}
