import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/server/admin";
import { getActiveVisitors } from "@/lib/server/presence";
import { isAdminProductId } from "@/lib/admin/products";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const productParam = searchParams.get("product");
  const product = isAdminProductId(productParam) ? productParam : "marketcard";

  try {
    const data = await getActiveVisitors(product);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[MarketCard AI] admin presence failed", error);
    return NextResponse.json({ error: "Failed to load presence" }, { status: 500 });
  }
}
