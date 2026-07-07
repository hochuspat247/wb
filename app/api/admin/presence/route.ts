import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server/admin";
import { getActiveVisitors } from "@/lib/server/presence";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await getActiveVisitors();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[MarketCard AI] admin presence failed", error);
    return NextResponse.json({ error: "Failed to load presence" }, { status: 500 });
  }
}
