import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateGeminiProductImage } from "@/lib/ai/geminiImage";
import { buildFallbackCard } from "@/lib/ai/fallback";
import { generateNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import { detectCategory } from "@/lib/category";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import { generateMarketplaceTextFallback } from "@/lib/marketplace/textFallback";
import { createDemoGeneration } from "@/lib/server/demo-generations";
import { getErrorMessage, logDemoGenerationError } from "@/lib/server/demo-errors";
import { checkGuestDemoGenerationAllowed, hashDemoClientIp } from "@/lib/server/demoRateLimit";
import { consumeGeneration, getUserQuota } from "@/lib/server/quota";
import type {
  GenerateImageInput,
  GenerateImageResult,
  ImageDesignPreset,
  ImageGenerationMode,
  ImageProviderMode,
  ProductCardInput,
  ProductCardResult
} from "@/types/product-card";
import type { MarketplaceTextInput } from "@/types/marketplace";

export const runtime = "nodejs";
export const maxDuration = 240;

const MAX_DEMO_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_DEMO_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type DemoGenerationRequest = {
  guestId?: string;
  cardInput?: ProductCardInput;
  imageBase64?: string;
  imageMimeType?: string;
  imageProvider?: ImageProviderMode;
  imageMode?: ImageGenerationMode;
  headline?: string;
  price?: string;
  ctaText?: string;
  designPreset?: ImageDesignPreset;
};

export async function POST(request: Request) {
  let guestId = "";
  let userId: string | null = null;

  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
    const body = (await request.json()) as DemoGenerationRequest;
    guestId = sanitizeGuestId(body.guestId);

    if (!guestId) {
      return NextResponse.json({ error: "Missing guest_id" }, { status: 400 });
    }

    const inputError = validateDemoGenerationRequest(body);

    if (inputError) {
      return NextResponse.json({ error: inputError }, { status: 400 });
    }

    const requestedCardInput = body.cardInput;

    if (!requestedCardInput) {
      return NextResponse.json({ error: "Добавьте описание товара, чтобы создать демо-карточку." }, { status: 400 });
    }

    if (userId) {
      const quota = await getUserQuota(userId);

      if (!quota.canGenerate) {
        return NextResponse.json(
          {
            error: "Бесплатные генерации использованы. Пополните баланс, чтобы продолжить.",
            code: "QUOTA_EXCEEDED",
            quota
          },
          { status: 402 }
        );
      }
    } else {
      const limit = await checkGuestDemoGenerationAllowed(request, guestId);

      if (!limit.allowed) {
        await logDemoGenerationError({
          message: limit.error,
          guestId,
          userId,
          code: limit.code,
          status: 429,
          source: "server"
        });

        return NextResponse.json(
          { error: limit.error, code: limit.code },
          {
            status: 429,
            headers: { "Retry-After": String(limit.retryAfterSeconds) }
          }
        );
      }
    }

    const marketplace = requestedCardInput.marketplace || "Wildberries";
    const category = detectCategory(requestedCardInput.productDescription.trim(), requestedCardInput.category?.trim());
    const platform = requestedCardInput.platform ?? marketplaceLabelToPlatform(marketplace);
    const textMode = requestedCardInput.textMode ?? "marketplace_safe";
    const cardInput: ProductCardInput = {
      ...requestedCardInput,
      productDescription: requestedCardInput.productDescription.trim(),
      category,
      marketplace,
      style: requestedCardInput.style || "Премиальный",
      includeSeo: true,
      focusBenefits: true,
      includeInfographicText: true,
      platform,
      textMode
    };

    const generatedText = buildFallbackCard(cardInput);
    const marketplaceText = generateMarketplaceTextFallback(buildMarketplaceInput(cardInput, generatedText));
    const card = enrichCard(generatedText, marketplaceText, cardInput, {
      headline: body.headline,
      price: body.price,
      ctaText: body.ctaText,
      designPreset: body.designPreset,
      imageMode: body.imageMode
    });
    const generatedImage = await generateDemoImage(card, body);
    const original = await resolveOriginalImage(card, generatedImage);
    const demo = await createDemoGeneration({
      guestId,
      userId,
      clientIpHash: hashDemoClientIp(request),
      card: {
        ...card,
        generatedImageProvider: generatedImage.provider,
        generatedImageModel: generatedImage.model,
        generatedImagePrompt: generatedImage.prompt,
        generatedImageIsFallback: generatedImage.isFallback,
        generatedImageError: generatedImage.error,
        generatedImageUrl: null,
        generatedImageDataUrl: undefined,
        generatedImageBase64: undefined,
        generatedImageMimeType: undefined,
        generationId: generatedImage.generationId,
        seed: generatedImage.seed
      },
      originalImageBase64: original.base64,
      originalImageMimeType: original.mimeType
    });
    const nextQuota = userId ? await consumeGeneration(userId) : undefined;

    return NextResponse.json({
      id: demo.id,
      status: demo.status,
      previewUrl: `/api/generations/${demo.id}/preview`,
      originalAvailable: Boolean(userId),
      quota: nextQuota
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[MarketCard AI] demo generation failed", error);

    await logDemoGenerationError({
      message,
      guestId: guestId || undefined,
      userId,
      code: "DEMO_FAILED",
      status: 500,
      source: "server"
    });

    return NextResponse.json(
      { error: "Не получилось создать карточку. Попробуйте ещё раз или загрузите другое фото.", code: "DEMO_FAILED" },
      { status: 500 }
    );
  }
}

function buildMarketplaceInput(cardInput: ProductCardInput, result: ProductCardResult): MarketplaceTextInput {
  return {
    platform: cardInput.platform ?? marketplaceLabelToPlatform(cardInput.marketplace),
    mode: cardInput.textMode ?? "marketplace_safe",
    productDescription: cardInput.productDescription,
    category: cardInput.category ?? result.category,
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
    keywords: result.keywords
  };
}

function enrichCard(
  result: ProductCardResult,
  marketplaceText: ReturnType<typeof generateMarketplaceTextFallback>,
  input: ProductCardInput,
  design: {
    headline?: string;
    price?: string;
    ctaText?: string;
    designPreset?: ImageDesignPreset;
    imageMode?: ImageGenerationMode;
  }
): ProductCardResult {
  return {
    ...result,
    platform: input.platform,
    textMode: input.textMode,
    title: marketplaceText.title || result.title,
    shortDescription: marketplaceText.shortDescription || result.shortDescription,
    fullDescription: marketplaceText.fullDescription || result.fullDescription,
    benefits: marketplaceText.advantages.length ? marketplaceText.advantages : result.benefits,
    characteristics: marketplaceText.characteristics.length ? marketplaceText.characteristics : result.characteristics,
    keywords: marketplaceText.keywords.length ? marketplaceText.keywords : result.keywords,
    infographicTexts: marketplaceText.infographicTexts.length ? marketplaceText.infographicTexts : result.infographicTexts,
    marketplaceText,
    headline: design.headline?.trim() || undefined,
    price: design.price?.trim() || input.price,
    ctaText: design.ctaText?.trim() || undefined,
    designPreset: design.designPreset || "premium-marketplace",
    sourceInput: {
      ...input,
      headline: design.headline?.trim() || undefined,
      price: design.price?.trim() || input.price,
      ctaText: design.ctaText?.trim() || undefined,
      designPreset: design.designPreset || "premium-marketplace",
      imageMode: design.imageMode,
      cardsCount: 1
    }
  };
}

async function generateDemoImage(card: ProductCardResult, body: DemoGenerationRequest): Promise<GenerateImageResult> {
  const input: GenerateImageInput = {
    productDescription: body.cardInput?.productDescription || card.shortDescription,
    category: card.category,
    marketplace: card.marketplace,
    style: card.style || "Премиальный",
    title: card.title,
    benefits: card.benefits,
    infographicTexts: card.infographicTexts,
    characteristics: card.characteristics,
    keywords: card.keywords,
    imageBase64: body.imageBase64,
    imageMimeType: body.imageMimeType,
    price: body.price || card.price,
    ctaText: body.ctaText || card.ctaText,
    headline: body.headline || card.headline,
    designPreset: body.designPreset || card.designPreset,
    model: "nb2",
    aspectRatio: "4:5",
    resolution: "1k",
    outputFormat: "png"
  };
  const provider = resolveImageProvider();
  const demoImageMode = resolveDemoImageMode();

  if (provider === "nanobanana_expert") {
    return generateNanoBananaExpertImage(input);
  }

  if (provider === "gemini") {
    return generateGeminiProductImage(input, demoImageMode);
  }

  if (provider === "html") {
    return createFallbackImageResult("HTML-preview выбран для демо.");
  }

  if (isNanoBananaExpertConfigured()) {
    const result = await generateNanoBananaExpertImage(input);
    if (!result.isFallback) return result;
  }

  if (process.env.GEMINI_API_KEY) {
    const result = await generateGeminiProductImage(input, demoImageMode);
    if (!result.isFallback) return result;
  }

  return createFallbackImageResult("AI-провайдеры недоступны. Показан fallback-preview.");
}

function resolveImageProvider(): ImageProviderMode {
  const fromEnv = (process.env.DEMO_IMAGE_PROVIDER || process.env.IMAGE_PROVIDER || "auto").toLowerCase() as ImageProviderMode;
  return fromEnv || "auto";
}

function resolveDemoImageMode(): ImageGenerationMode {
  const mode = (process.env.DEMO_IMAGE_MODE || "fast").toLowerCase();
  return mode === "legacy" ? "legacy" : "fast";
}

function sanitizeGuestId(value?: string) {
  const clean = value?.trim();

  if (!clean || clean.length > 80) {
    return "";
  }

  return /^[a-zA-Z0-9_-]{8,80}$/.test(clean) ? clean : "";
}

function validateDemoGenerationRequest(body: DemoGenerationRequest) {
  if (!body.cardInput?.productDescription?.trim()) {
    return "Добавьте описание товара, чтобы создать демо-карточку.";
  }

  if (!body.imageBase64 || !body.imageMimeType) {
    return "Загрузите фото товара, чтобы создать демо-карточку.";
  }

  if (!SUPPORTED_DEMO_IMAGE_TYPES.includes(body.imageMimeType)) {
    return "Поддерживаются только image/jpeg, image/png и image/webp.";
  }

  const size = Buffer.byteLength(body.imageBase64, "base64");

  if (size > MAX_DEMO_IMAGE_SIZE_BYTES) {
    return "Изображение слишком большое. Загрузите файл до 5 МБ.";
  }

  return null;
}

async function resolveOriginalImage(card: ProductCardResult, image: GenerateImageResult) {
  if (image.imageBase64 && image.mimeType) {
    return { base64: image.imageBase64, mimeType: image.mimeType };
  }

  if (image.imageUrl) {
    const response = await fetch(image.imageUrl);
    if (response.ok) {
      const mimeType = response.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await response.arrayBuffer());
      return { base64: buffer.toString("base64"), mimeType };
    }
  }

  const svg = createCleanCardSvg(card);
  return { base64: Buffer.from(svg).toString("base64"), mimeType: "image/svg+xml" };
}

function createFallbackImageResult(error: string): GenerateImageResult {
  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider: "HTML/CSS fallback",
    model: "fallback",
    prompt: "",
    generatedAt: new Date().toISOString(),
    isFallback: true,
    error
  };
}

function createCleanCardSvg(card: ProductCardResult) {
  const title = escapeXml(card.title).slice(0, 90);
  const subtitle = escapeXml(card.shortDescription).slice(0, 140);
  const bullets = card.benefits.slice(0, 3).map((item) => escapeXml(item).slice(0, 64));

  return `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1350" fill="#f3efe7"/>
      <rect x="70" y="70" width="940" height="1210" rx="42" fill="#ffffff"/>
      <rect x="120" y="120" width="840" height="610" rx="34" fill="#d8f7d2"/>
      <circle cx="540" cy="425" r="168" fill="#151922" opacity="0.08"/>
      <text x="120" y="825" fill="#151922" font-family="Arial, sans-serif" font-size="68" font-weight="900">${title}</text>
      <text x="120" y="905" fill="#5d655f" font-family="Arial, sans-serif" font-size="34" font-weight="600">${subtitle}</text>
      ${bullets
        .map((item, index) => `<text x="140" y="${1010 + index * 70}" fill="#151922" font-family="Arial, sans-serif" font-size="40" font-weight="800">• ${item}</text>`)
        .join("")}
      <rect x="120" y="1190" width="360" height="78" rx="39" fill="#7cff6b"/>
      <text x="165" y="1242" fill="#151922" font-family="Arial, sans-serif" font-size="30" font-weight="900">MarketCard AI</text>
    </svg>
  `;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
