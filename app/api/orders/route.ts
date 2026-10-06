import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrders } from "@/lib/orders";
import { storageUnavailable } from "@/lib/json-store";
import { isValidSession, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    return NextResponse.json({ orders: await getOrders() });
  } catch (error) {
    return storageUnavailable(error);
  }
}
