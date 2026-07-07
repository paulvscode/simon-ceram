import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createKeyword, getKeywords } from "@/lib/keywords";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

// Public: the shop page's keyword filter needs to read the list too.
export async function GET() {
  const keywords = await getKeywords();
  return NextResponse.json({ keywords });
}

export async function POST(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { label } = await request.json();
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Le mot-clé est requis." }, { status: 400 });
  }

  const keyword = await createKeyword(label);
  return NextResponse.json({ keyword }, { status: 201 });
}
