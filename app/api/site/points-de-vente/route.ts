import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { savePointsDeVente } from "@/lib/site-content";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function PUT(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // Trimmed, capped, links checked and unnamed entries dropped by normalizePointsDeVente.
  const pointsDeVente = await savePointsDeVente(await request.json().catch(() => []));
  return NextResponse.json({ pointsDeVente });
}
