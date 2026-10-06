import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addProduct, getPublicProducts, parseProductFields } from "@/lib/products";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

// Public (the cart resolves its ids here): online pieces only. The admin
// reads the full catalogue server-side, not through this route.
export async function GET() {
  const products = await getPublicProducts();
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
    showDescription: fields.showDescription ?? true,
    online: fields.online ?? true,
    heightCm: fields.heightCm ?? null,
    widthCm: fields.widthCm ?? null,
    lengthCm: fields.lengthCm ?? null,
    diameterCm: fields.diameterCm ?? null,
    weightG: fields.weightG ?? null,
  });

  return NextResponse.json({ product }, { status: 201 });
}
