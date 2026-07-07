import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteKeyword, renameKeyword } from "@/lib/keywords";
import { removeKeywordFromAllProducts } from "@/lib/products";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { label } = await request.json();
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Le mot-clé est requis." }, { status: 400 });
  }

  const { id } = await params;
  await renameKeyword(id, label);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  await deleteKeyword(id);
  await removeKeywordFromAllProducts(id);
  return NextResponse.json({ ok: true });
}
