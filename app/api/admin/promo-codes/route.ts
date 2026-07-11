import { NextResponse } from "next/server";
import { isAdminProductId } from "@/lib/admin/products";
import { createPromoCode, listPromoCodes, PromoCodeError } from "@/lib/server/promoCodes";
import { requireAdminSession } from "@/lib/server/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const productParam = searchParams.get("product");
  const status = statusParam === "active" || statusParam === "redeemed" ? statusParam : undefined;
  const product = isAdminProductId(productParam) ? productParam : undefined;

  try {
    const codes = await listPromoCodes({ status, product });
    return NextResponse.json({ codes });
  } catch (error) {
    console.error("[Promo] Admin list failed", error);
    return NextResponse.json({ error: "Failed to load promo codes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { assignedEmail?: string; product?: string; note?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assignedEmail = body.assignedEmail?.trim();
  const product = body.product;

  if (!assignedEmail || !isAdminProductId(product)) {
    return NextResponse.json({ error: "Укажите email и сервис." }, { status: 400 });
  }

  try {
    const promo = await createPromoCode({
      assignedEmail,
      product,
      note: body.note
    });

    return NextResponse.json({ promo });
  } catch (error) {
    if (error instanceof PromoCodeError) {
      const status = error.code === "DUPLICATE_ACTIVE" ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("[Promo] Admin create failed", error);
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}
