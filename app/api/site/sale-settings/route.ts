import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { saveSaleSettings } from "@/lib/site-content";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function PUT(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // Trimmed, length-capped and defaulted by normalizeSaleSettings.
  const settings = await saveSaleSettings(await request.json().catch(() => ({})));
  return NextResponse.json({ settings });
}
