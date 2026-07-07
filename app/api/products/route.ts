import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addProduct, getProducts } from "@/lib/products";
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

  const body = await request.json();
  const { title, subtitle, description, imageUrl, priceEuros, collection } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
  }

  const priceCents = Math.round(Number(priceEuros) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json({ error: "Le prix doit être un nombre positif." }, { status: 400 });
  }

  const product = await addProduct({
    title,
    subtitle: subtitle ?? "",
    description: description ?? "",
    imageUrl: imageUrl ?? "",
    priceCents,
    collection: collection ?? "",
  });

  return NextResponse.json({ product }, { status: 201 });
}
