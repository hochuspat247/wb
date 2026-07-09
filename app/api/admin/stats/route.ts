import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/server/analytics";
import { requireAdminSession } from "@/lib/server/admin";
import { isAdminProductId } from "@/lib/admin/products";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";
  const productParam = searchParams.get("product");
  const product = isAdminProductId(productParam) ? productParam : "marketcard";

  try {
    const stats = await getAdminAnalytics(path, product);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[MarketCard AI] Admin stats failed", error);
    return NextResponse.json({ error: "Failed to load admin stats" }, { status: 500 });
  }
}
