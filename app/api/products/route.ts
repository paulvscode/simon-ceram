import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addProduct, getProducts, parseProductFields } from "@/lib/products";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const parsed = parseProductFields((await request.json()) ?? {});
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { fields } = parsed;
  if (!fields.title) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }
  if (fields.priceCents === undefined) {
    return NextResponse.json({ error: "Le prix doit être un nombre positif." }, { status: 400 });
  }

  const product = await addProduct({
    title: fields.title,
    subtitle: fields.subtitle ?? "",
    description: fields.description ?? "",
    imageUrl: fields.imageUrl ?? "",
    hoverImageUrl: fields.hoverImageUrl ?? "",
    priceCents: fields.priceCents,
    collection: fields.collection ?? "",
    showDescription: fields.showDescription ?? false,
  });

  return NextResponse.json({ product }, { status: 201 });
}
