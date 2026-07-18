import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assessGenerationContentPolicy, scanTextForProhibitedContent } from "@/lib/ai/contentPolicy";
import { generateProductCard } from "@/lib/ai/providers";
import { resolveProductContextFromImage } from "@/lib/ai/productVision";
import { generateMarketplaceText } from "@/lib/marketplace/textGenerator";
import {
  normalizeCardStyle,
  normalizeMarketplaceLabel,
  normalizeMarketplacePlatform,
  normalizeProductCardInput,
  normalizeTextMode,
  validateProductCardInput
} from "@/lib/marketplace/cardFormValidation";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import {
  createImageGenerationTicket,
  ImageGenerationQuotaExceededError,
  revokeImageGenerationTicket
} from "@/lib/server/imageGenerationTickets";
import { getUserQuota } from "@/lib/server/quota";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { normalizePreviousCardSnapshot } from "@/lib/series/editing";
import type { ProductCardInput, PreviousCardSnapshot } from "@/types/product-card";
import type { MarketplaceTextInput } from "@/types/marketplace";

export const runtime = "nodejs";
export const maxDuration = 300;

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 240);
  }

  return "unknown";
}

async function generateCardWithOptionalTemplate(cardInput: ProductCardInput) {
  try {
    return await generateProductCard(cardInput);
  } catch (error) {
    if (!cardInput.previousCard && !cardInput.editInstructions) {
      throw error;
    }

    console.warn(
      "[MarketCard AI] generate-card retry without similar template:",
      getErrorDetails(error)
    );

    return generateProductCard({
      ...cardInput,
      previousCard: undefined,
      editInstructions: undefined
    });
  }
}

async function generateMarketplaceTextWithOptionalTemplate(input: MarketplaceTextInput) {
  try {
    return await generateMarketplaceText(input);
  } catch (error) {
    if (!input.previousCard && !input.editInstructions) {
      throw error;
    }

    console.warn(
      "[MarketCard AI] marketplace text retry without similar template:",
      getErrorDetails(error)
    );

    return generateMarketplaceText({
      ...input,
      previousCard: undefined,
      editInstructions: undefined
    });
  }
}

export async function POST(request: Request) {
  let imageGenerationTicket: string | null = null;
  let userId: string | null = null;

  try {
    const session = await auth();
    userId = session?.user?.id ?? null;

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

    let rawBody: ProductCardInput;
    try {
      rawBody = (await request.json()) as ProductCardInput;
    } catch {
      return NextResponse.json({ error: "Некорректное тело запроса.", code: "INVALID_JSON" }, { status: 400 });
    }

    const body = normalizeProductCardInput(rawBody);
    const validationError = validateProductCardInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    imageGenerationTicket = await createImageGenerationTicket(userId);

    const initialPolicy = scanTextForProhibitedContent(
      [body.productDescription, body.category, body.brand, body.sellerWishes, body.editInstructions]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join("\n")
    );

    if (!initialPolicy.allowed) {
      await revokeImageGenerationTicket(imageGenerationTicket, userId);
      return createContentPolicyBlockedResponse(initialPolicy);
    }

    const marketplace = normalizeMarketplaceLabel(body.marketplace);
    const productContext = await resolveProductContextFromImage({
      productDescription: body.productDescription.trim(),
      category: body.category?.trim(),
      brand: body.brand?.trim(),
      identifiedProductName: body.identifiedProductName?.trim(),
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
      await revokeImageGenerationTicket(imageGenerationTicket, userId);
      return createContentPolicyBlockedResponse(resolvedPolicy);
    }

    const platform = body.platform ?? normalizeMarketplacePlatform(marketplace);
    const textMode = normalizeTextMode(body.textMode);
    let previousCard: PreviousCardSnapshot | undefined;

    try {
      previousCard = normalizePreviousCardSnapshot(rawBody.previousCard ?? body.previousCard);
    } catch (error) {
      console.warn("[MarketCard AI] previousCard normalize failed:", getErrorDetails(error));
      previousCard = undefined;
    }

    const cardInput: ProductCardInput = {
      productDescription: productContext.productDescription,
      category,
      marketplace,
      style: normalizeCardStyle(body.style),
      includeSeo: Boolean(body.includeSeo),
      focusBenefits: Boolean(body.focusBenefits),
      includeInfographicText: Boolean(body.includeInfographicText),
      imageFileName: body.imageFileName,
      sellerWishes: productContext.sellerWishes,
      identifiedProductName:
        body.identifiedProductName?.trim() || productContext.identifiedProductName,
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
      previousCard
    };

    const result = await generateCardWithOptionalTemplate(cardInput);

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
      advantages: Array.isArray(result.benefits) ? result.benefits : [],
      characteristics: Array.isArray(result.characteristics) ? result.characteristics : [],
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      editInstructions: cardInput.editInstructions,
      previousCard: cardInput.previousCard
    };

    const marketplaceText = await generateMarketplaceTextWithOptionalTemplate(marketplaceInput);

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

    const nextQuota = await getUserQuota(userId);

    return NextResponse.json({
      ...enrichedResult,
      quota: nextQuota,
      imageGenerationTicket
    });
  } catch (error) {
    if (imageGenerationTicket && userId) {
      try {
        await revokeImageGenerationTicket(imageGenerationTicket, userId);
      } catch (revokeError) {
        console.warn("[MarketCard AI] ticket revoke failed:", getErrorDetails(revokeError));
      }
    }

    if (error instanceof ImageGenerationQuotaExceededError) {
      const quota = userId ? await getUserQuota(userId) : undefined;

      return NextResponse.json(
        {
          error: "Бесплатный лимит использован. Купите комплект для одного товара, чтобы продолжить.",
          code: "QUOTA_EXCEEDED",
          quota
        },
        { status: 402 }
      );
    }

    const details = getErrorDetails(error);
    console.error("[MarketCard AI] generate-card failed", error);
    return NextResponse.json(
      {
        error: "Не удалось сгенерировать карточку.",
        code: "GENERATE_CARD_FAILED",
        details
      },
      { status: 500 }
    );
  }
}
