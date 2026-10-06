import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteProduct, parseProductFields, updateProduct } from "@/lib/products";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const parsed = parseProductFields((await request.json()) ?? {});
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (Object.keys(parsed.fields).length === 0) {
    return NextResponse.json({ error: "Aucune modification." }, { status: 400 });
  }

  const { id } = await params;
  const product = await updateProduct(id, parsed.fields);
  if (!product) {
    return NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
  }
  return NextResponse.json({ product });
}
