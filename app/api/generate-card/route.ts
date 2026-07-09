import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assessGenerationContentPolicy, scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { generateProductCard } from "@/lib/ai/providers";
import { resolveProductContextFromImage } from "@/lib/ai/productVision";
import { generateMarketplaceText } from "@/lib/marketplace/textGenerator";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
import { createImageGenerationTicket } from "@/lib/server/imageGenerationTickets";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import type { ProductCardInput } from "@/types/product-card";
import type { MarketplaceTextInput } from "@/types/marketplace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы сгенерировать карточку." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    const quota = await getUserQuota(userId);

    if (!quota.canGenerate) {
      return NextResponse.json(
        {
          error: "Бесплатные генерации использованы. Купите пакет, чтобы продолжить.",
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

    const initialPolicy = scanTextForProhibitedContent(
      [body.productDescription, body.category, body.brand, body.sellerWishes, body.editInstructions]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join("\n")
    );

    if (!initialPolicy.allowed) {
      return createContentPolicyBlockedResponse(initialPolicy);
    }

    const marketplace = body.marketplace || "Wildberries";
    const productContext = await resolveProductContextFromImage({
      productDescription: body.productDescription.trim(),
      category: body.category?.trim(),
      brand: body.brand?.trim(),
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType
    });
    const category = productContext.category;
    const resolvedPolicy = await assessGenerationContentPolicy({
      productDescription: productContext.productDescription,
      category,
      brand: productContext.brand,
      sellerWishes: productContext.sellerWishes,
      editInstructions: body.editInstructions?.trim(),
      identifiedProductName: productContext.identifiedProductName,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType
    });

    if (!resolvedPolicy.allowed) {
      return createContentPolicyBlockedResponse(resolvedPolicy);
    }

    const platform = body.platform ?? marketplaceLabelToPlatform(marketplace);
    const textMode = body.textMode ?? "marketplace_safe";

    const cardInput: ProductCardInput = {
      productDescription: productContext.productDescription,
      category,
      marketplace,
      style: body.style || "Минималистичный",
      includeSeo: Boolean(body.includeSeo),
      focusBenefits: Boolean(body.focusBenefits),
      includeInfographicText: Boolean(body.includeInfographicText),
      imageFileName: body.imageFileName,
      sellerWishes: productContext.sellerWishes,
      identifiedProductName: productContext.identifiedProductName,
      platform,
      textMode,
      brand: productContext.brand,
      sellerSku: body.sellerSku?.trim(),
      color: body.color?.trim(),
      size: body.size?.trim(),
      material: body.material?.trim(),
      dimensions: body.dimensions?.trim(),
      weight: body.weight?.trim(),
      packageContents: body.packageContents?.trim(),
      targetAudience: body.targetAudience?.trim(),
      useCase: body.useCase?.trim(),
      price: body.price?.trim(),
      oldPrice: body.oldPrice?.trim(),
      discount: body.discount?.trim(),
      editInstructions: body.editInstructions?.trim(),
      previousCard: body.previousCard
    };

    const result = await generateProductCard(cardInput);

    const marketplaceInput: MarketplaceTextInput = {
      platform,
      mode: textMode,
      productDescription: cardInput.productDescription,
      category,
      sellerWishes: cardInput.sellerWishes,
      identifiedProductName: cardInput.identifiedProductName,
      brand: cardInput.brand,
      sellerSku: cardInput.sellerSku,
      color: cardInput.color,
      size: cardInput.size,
      material: cardInput.material,
      dimensions: cardInput.dimensions,
      weight: cardInput.weight,
      packageContents: cardInput.packageContents,
      targetAudience: cardInput.targetAudience,
      useCase: cardInput.useCase,
      price: cardInput.price,
      oldPrice: cardInput.oldPrice,
      discount: cardInput.discount,
      advantages: result.benefits,
      characteristics: result.characteristics,
      keywords: result.keywords,
      editInstructions: cardInput.editInstructions,
      previousCard: cardInput.previousCard
    };

    const marketplaceText = await generateMarketplaceText(marketplaceInput);

    const enrichedResult = {
      ...result,
      platform,
      textMode,
      title: marketplaceText.title || result.title,
      shortDescription: marketplaceText.shortDescription || result.shortDescription,
      fullDescription: marketplaceText.fullDescription || result.fullDescription,
      benefits: marketplaceText.advantages.length ? marketplaceText.advantages : result.benefits,
      characteristics: marketplaceText.characteristics.length ? marketplaceText.characteristics : result.characteristics,
      keywords: marketplaceText.keywords.length ? marketplaceText.keywords : result.keywords,
      infographicTexts: marketplaceText.infographicTexts.length ? marketplaceText.infographicTexts : result.infographicTexts,
      marketplaceText
    };

    const nextQuota = await consumeGeneration(userId);
    const imageGenerationTicket = await createImageGenerationTicket(userId);

    return NextResponse.json({
      ...enrichedResult,
      quota: nextQuota,
      imageGenerationTicket
    });
  } catch (error) {
    console.error("[MarketCard AI] generate-card failed", error);
    return NextResponse.json({ error: "Не удалось сгенерировать карточку." }, { status: 500 });
  }
}
