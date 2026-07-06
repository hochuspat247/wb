import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateProductCard } from "@/lib/ai/providers";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
import type { ProductCardInput } from "@/types/product-card";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы сгенерировать карточку." }, { status: 401 });
    }

    const quota = await getUserQuota(userId);

    if (!quota.canGenerate) {
      return NextResponse.json(
        {
          error: "Бесплатная генерация использована. Купите пакет, чтобы продолжить.",
          code: "QUOTA_EXCEEDED",
          quota
        },
        { status: 402 }
      );
    }

    const body = (await request.json()) as ProductCardInput;

    if (!body.productDescription?.trim()) {
      return NextResponse.json(
        { error: "Добавьте описание товара, чтобы сгенерировать карточку." },
        { status: 400 }
      );
    }

    const result = await generateProductCard({
      productDescription: body.productDescription.trim(),
      category: body.category?.trim(),
      marketplace: body.marketplace || "Wildberries",
      style: body.style || "Минималистичный",
      includeSeo: Boolean(body.includeSeo),
      focusBenefits: Boolean(body.focusBenefits),
      includeInfographicText: Boolean(body.includeInfographicText),
      imageFileName: body.imageFileName
    });

    const nextQuota = await consumeGeneration(userId);

    return NextResponse.json({
      ...result,
      quota: nextQuota
    });
  } catch (error) {
    console.error("[MarketCard AI] generate-card failed", error);
    return NextResponse.json({ error: "Не удалось сгенерировать карточку." }, { status: 500 });
  }
}
