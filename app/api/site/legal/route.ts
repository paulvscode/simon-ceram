import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveLegalPage } from "@/lib/site-content";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

const MAX_HTML_LENGTH = 200_000;

export async function PUT(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { html } = (await request.json().catch(() => ({}))) ?? {};
  if (typeof html !== "string" || html.length > MAX_HTML_LENGTH) {
    return NextResponse.json({ error: "Contenu invalide." }, { status: 400 });
  }

  // Sanitized against the editor's allowlist inside saveLegalPage.
  const page = await saveLegalPage(html);
  return NextResponse.json({ page });
}
