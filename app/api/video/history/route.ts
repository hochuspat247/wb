import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserVideoOrders } from "@/lib/server/videoOrders";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getUserVideoOrders(userId);
  return NextResponse.json({ orders });
}
