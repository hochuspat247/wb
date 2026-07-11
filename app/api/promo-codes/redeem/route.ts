import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminProductId } from "@/lib/admin/products";
import { PromoCodeError, redeemPromoCode } from "@/lib/server/promoCodes";
import { backfillCleanDownloadGeneration, getUserDownloadAccess } from "@/lib/server/downloadAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId || !userEmail) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { code?: string; product?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  const product = body.product;

  if (!code || !isAdminProductId(product)) {
    return NextResponse.json({ error: "Введите промокод.", code: "INVALID_CODE" }, { status: 400 });
  }

  try {
    const result = await redeemPromoCode({
      userId,
      userEmail,
      code,
      product
    });

    await backfillCleanDownloadGeneration(userId);
    const access = await getUserDownloadAccess(userId);

    return NextResponse.json({
      ...result,
      quota: {
        ...result.quota,
        cleanDownloadGenerationId: access.freeCleanDownloadGenerationId,
        downloadsFullyUnlocked: access.downloadsFullyUnlocked
      }
    });
  } catch (error) {
    if (error instanceof PromoCodeError) {
      const status =
        error.code === "ALREADY_REDEEMED"
          ? 409
          : error.code === "EMAIL_MISMATCH" || error.code === "PRODUCT_MISMATCH"
            ? 403
            : 400;

      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }

    console.error("[Promo] Redeem failed", error);
    return NextResponse.json({ error: "Не удалось активировать промокод." }, { status: 500 });
  }
}
