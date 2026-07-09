import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assessGenerationContentPolicy } from "@/lib/ai/contentPolicy";
import { generateGeminiProductImage } from "@/lib/ai/geminiImage";
import { generateNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import { consumeImageGenerationTicket } from "@/lib/server/imageGenerationTickets";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { consumeGeneration, getUserQuota, type UserQuota } from "@/lib/server/quota";
import type {
  GenerateImageInput,
  ImageDesignPreset,
  ImageGenerationMode,
  ImageProviderMode,
  ProductCardResult
} from "@/types/product-card";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type GenerateImageRequest = GenerateImageInput & {
  imageProvider?: ImageProviderMode;
  imageMode?: ImageGenerationMode;
  imageGenerationTicket?: string;
};

type LegacyImageRequest = {
  card?: ProductCardResult;
  productDescription?: string;
  imageDataUrl?: string;
  style?: string;
  marketplace?: string;
  imageProvider?: ImageProviderMode;
  imageMode?: ImageGenerationMode;
};

function createHtmlFallback(message: string, prompt = "") {
  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider: "HTML/CSS fallback",
    model: "fallback",
    prompt,
    generatedAt: new Date().toISOString(),
    isFallback: true,
    error: message
  };
}

function applyImageDefaults(input: GenerateImageRequest): GenerateImageRequest {
  return {
    ...input,
    price: input.price?.trim() || "Цена: по запросу",
    ctaText: input.ctaText?.trim() || "ДОБАВИТЬ В КОРЗИНУ",
    designPreset: input.designPreset || "premium-marketplace",
    style: input.style?.trim() || "Премиальный",
    model: input.model || "nb2",
    aspectRatio: input.aspectRatio || "4:5",
    resolution: input.resolution || "1k",
    outputFormat: input.outputFormat || "png"
  };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы сгенерировать обложку." }, { status: 401 });
    }

    const user = await getUserForProtectedAction(userId);

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const verificationError = getEmailVerificationError(user);
    if (verificationError) {
      return NextResponse.json(verificationError, { status: 403 });
    }

    const parsed = await parseGenerateImageRequest(request);
    const input = applyImageDefaults(parsed);
    const validationError = validateGenerateImageInput(input);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const policy = await assessGenerationContentPolicy({
      productDescription: input.productDescription,
      category: input.category,
      title: input.title,
      benefits: input.benefits,
      infographicTexts: input.infographicTexts,
      keywords: input.keywords,
      editInstructions: input.editInstructions,
      imageBase64: input.imageBase64,
      imageMimeType: input.imageMimeType
    });

    if (!policy.allowed) {
      return createContentPolicyBlockedResponse(policy);
    }

    const provider = resolveImageProvider(input);

    if (provider === "html" || input.imageProvider === "html" || input.imageMode === "html") {
      return NextResponse.json(
        createHtmlFallback("AI-изображение не запрашивалось. Показан fallback-preview.", "HTML-preview выбран в настройках изображения.")
      );
    }

    const quota = await authorizePaidImageGeneration(userId, input.imageGenerationTicket);
    const result = await generateWithProvider(provider, input);
    return NextResponse.json({ ...result, quota });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сгенерировать AI-изображение.";
    console.error("[MarketCard AI] generate-image failed:", message);

    if (message === "IMAGE_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Бесплатные генерации использованы. Пополните баланс, чтобы продолжить.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }

    return NextResponse.json(createHtmlFallback(message), { status: 200 });
  }
}

async function authorizePaidImageGeneration(userId: string, imageGenerationTicket?: string): Promise<UserQuota | undefined> {
  const ticketAccepted = await consumeImageGenerationTicket(imageGenerationTicket, userId);

  if (ticketAccepted) {
    return undefined;
  }

  const quota = await getUserQuota(userId);

  if (!quota.canGenerate) {
    throw new Error("IMAGE_QUOTA_EXCEEDED");
  }

  return consumeGeneration(userId);
}

function resolveImageProvider(input: GenerateImageRequest): ImageProviderMode {
  const fromRequest = input.imageProvider?.toLowerCase() as ImageProviderMode | undefined;
  const fromEnv = (process.env.IMAGE_PROVIDER || "auto").toLowerCase() as ImageProviderMode;

  if (fromRequest && fromRequest !== "auto") {
    return fromRequest;
  }

  if (fromEnv && fromEnv !== "auto") {
    return fromEnv;
  }

  return "auto";
}

async function generateWithProvider(provider: ImageProviderMode, input: GenerateImageRequest) {
  if (provider === "nanobanana_expert") {
    return generateNanoBananaExpertImage(input);
  }

  if (provider === "gemini") {
    return generateGeminiProductImage(input, input.imageMode);
  }

  if (provider === "auto") {
    if (isNanoBananaExpertConfigured()) {
      const nanoResult = await generateNanoBananaExpertImage(input);

      if (!nanoResult.isFallback) {
        return nanoResult;
      }
    }

    if (process.env.GEMINI_API_KEY) {
      const geminiResult = await generateGeminiProductImage(input, input.imageMode);

      if (!geminiResult.isFallback) {
        return geminiResult;
      }
    }

    return createHtmlFallback(
      "AI-провайдеры недоступны или вернули ошибку. Показан fallback-preview.",
      input.productDescription
    );
  }

  return createHtmlFallback(`Unknown IMAGE_PROVIDER: ${provider}`);
}

async function parseGenerateImageRequest(request: Request): Promise<GenerateImageRequest> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      throw new Error("Для генерации изображения нужно загрузить фото товара.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Изображение слишком большое. Загрузите файл до 5 МБ.");
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Поддерживаются только image/jpeg, image/png и image/webp.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    return {
      productDescription: getFormString(formData, "productDescription"),
      category: getFormString(formData, "category"),
      marketplace: getFormString(formData, "marketplace"),
      style: getFormString(formData, "style"),
      title: getFormString(formData, "title"),
      benefits: getFormStringArray(formData, "benefits"),
      infographicTexts: getFormStringArray(formData, "infographicTexts"),
      characteristics: getFormCharacteristics(formData, "characteristics"),
      keywords: getFormStringArray(formData, "keywords"),
      imageBase64: buffer.toString("base64"),
      imageMimeType: file.type,
      price: getFormString(formData, "price"),
      ctaText: getFormString(formData, "ctaText"),
      headline: getFormString(formData, "headline"),
      designPreset: getFormString(formData, "designPreset") as ImageDesignPreset,
      imageProvider: getFormString(formData, "imageProvider") as ImageProviderMode,
      imageMode: getFormString(formData, "imageMode") as ImageGenerationMode,
      imageGenerationTicket: getFormString(formData, "imageGenerationTicket"),
      model: getFormString(formData, "model") as "nb2" | "gpt2",
      aspectRatio: getFormString(formData, "aspectRatio"),
      resolution: getFormString(formData, "resolution") as "1k" | "2k" | "4k",
      outputFormat: getFormString(formData, "outputFormat") as "png" | "jpeg" | "webp",
      seriesStyleGuide: getFormString(formData, "seriesStyleGuide"),
      seriesCardType: getFormString(formData, "seriesCardType"),
      seriesCardGoal: getFormString(formData, "seriesCardGoal"),
      seriesCardVisualIdea: getFormString(formData, "seriesCardVisualIdea"),
      badges: getFormStringArray(formData, "badges")
    };
  }

  const body = (await request.json()) as Partial<GenerateImageRequest> & LegacyImageRequest;

  if (body.imageBase64 && body.imageMimeType) {
    return {
      productDescription: body.productDescription || "",
      category: body.category || "",
      marketplace: body.marketplace || "",
      style: body.style || "",
      title: body.title || "",
      benefits: body.benefits || [],
      infographicTexts: body.infographicTexts || [],
      characteristics: body.characteristics,
      keywords: body.keywords,
      imageBase64: body.imageBase64,
      imageMimeType: body.imageMimeType,
      price: body.price,
      ctaText: body.ctaText,
      headline: body.headline,
      designPreset: body.designPreset,
      imageProvider: body.imageProvider,
      imageMode: body.imageMode,
      imageGenerationTicket: body.imageGenerationTicket,
      model: body.model,
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      outputFormat: body.outputFormat,
      seriesStyleGuide: body.seriesStyleGuide,
      seriesCardType: body.seriesCardType,
      seriesCardGoal: body.seriesCardGoal,
      seriesCardVisualIdea: body.seriesCardVisualIdea,
      badges: body.badges
    };
  }

  if (body.card && body.imageDataUrl) {
    const image = parseDataUrl(body.imageDataUrl);

    return {
      productDescription: body.productDescription || body.card.shortDescription,
      category: body.card.category,
      marketplace: body.marketplace || body.card.marketplace,
      style: body.style || body.card.style,
      title: body.card.title,
      benefits: body.card.benefits,
      infographicTexts: body.card.infographicTexts,
      characteristics: body.card.characteristics,
      keywords: body.card.keywords,
      imageBase64: image.base64,
      imageMimeType: image.mimeType,
      price: body.price || body.card.price,
      ctaText: body.ctaText || body.card.ctaText,
      headline: body.headline || body.card.headline,
      designPreset: body.designPreset || body.card.designPreset,
      imageProvider: body.imageProvider,
      imageMode: body.imageMode,
      imageGenerationTicket: body.imageGenerationTicket,
      model: body.model,
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      outputFormat: body.outputFormat,
      seriesStyleGuide: body.seriesStyleGuide,
      seriesCardType: body.seriesCardType,
      seriesCardGoal: body.seriesCardGoal,
      seriesCardVisualIdea: body.seriesCardVisualIdea,
      badges: body.badges
    };
  }

  throw new Error("Для AI-изображения нужны текст карточки и загруженное фото товара.");
}

function validateGenerateImageInput(input: GenerateImageRequest) {
  if (!input.productDescription.trim() || !input.title.trim()) {
    return "Для AI-изображения нужны описание товара и текст карточки.";
  }

  if (!input.imageBase64 || !input.imageMimeType) {
    return "Для AI-изображения нужно загруженное фото товара.";
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(input.imageMimeType)) {
    return "Поддерживаются только image/jpeg, image/png и image/webp.";
  }

  const size = Buffer.byteLength(input.imageBase64, "base64");

  if (size > MAX_IMAGE_SIZE_BYTES) {
    return "Изображение слишком большое. Загрузите файл до 5 МБ.";
  }

  return null;
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFormStringArray(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
  }
}

function getFormCharacteristics(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed
      .filter((item) => item && typeof item.key === "string" && typeof item.value === "string")
      .map((item) => ({ key: item.key, value: item.value }));
  } catch {
    return undefined;
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Некорректный формат изображения.");
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}
