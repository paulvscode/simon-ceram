import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getShopSettings,
  SHOP_SETTING_KEYS,
  updateShopSettings,
  type ShopSettings,
} from "@/lib/shop-settings";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const settings = await getShopSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: NextRequest) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await request.json();
  const patch: Partial<ShopSettings> = {};
  for (const key of SHOP_SETTING_KEYS) {
    if (typeof body[key] === "boolean") patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun réglage valide." }, { status: 400 });
  }

  const settings = await updateShopSettings(patch);
  return NextResponse.json({ settings });
}
