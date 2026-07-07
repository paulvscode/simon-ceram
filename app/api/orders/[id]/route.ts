import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markOrderShipped } from "@/lib/orders";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  await markOrderShipped(id);
  return NextResponse.json({ ok: true });
}
