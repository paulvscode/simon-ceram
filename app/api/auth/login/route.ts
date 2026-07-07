import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookieValue, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) ?? {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Configuration serveur manquante (ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== adminPassword) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const value = await createSessionCookieValue();
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
