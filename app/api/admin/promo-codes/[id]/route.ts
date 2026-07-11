import { NextResponse } from "next/server";
import { PromoCodeError, revokePromoCode } from "@/lib/server/promoCodes";
import { requireAdminSession } from "@/lib/server/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await revokePromoCode(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PromoCodeError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("[Promo] Admin revoke failed", error);
    return NextResponse.json({ error: "Failed to revoke promo code" }, { status: 500 });
  }
}
