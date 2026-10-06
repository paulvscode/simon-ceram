import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveHomeBackground } from "@/lib/site-content";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function PUT(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // Values are clamped and the image URL checked by normalizeHomeBackground.
  const background = await saveHomeBackground(await request.json().catch(() => ({})));
  return NextResponse.json({ background });
}
