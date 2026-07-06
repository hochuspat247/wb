import { NextResponse } from "next/server";
import { generateProductCard } from "@/lib/ai/providers";
import type { ProductCardInput } from "@/types/product-card";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("[MarketCard AI] generate-card failed", error);
    return NextResponse.json({ error: "Не удалось сгенерировать карточку." }, { status: 500 });
  }
}
