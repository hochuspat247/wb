import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/server/analytics";
import { requireAdminSession } from "@/lib/server/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";

  try {
    const stats = await getAdminAnalytics(path);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[MarketCard AI] Admin stats failed", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
