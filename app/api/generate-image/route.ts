import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assessGenerationContentPolicy } from "@/lib/ai/contentPolicy";
import { generateProductImageWithProvider, resolveImageProvider } from "@/lib/ai/imageProviders";
import { IMAGE_GENERATION_RETRY_MESSAGE } from "@/lib/ai/imageGenerationErrors";
import {
  NANO_BANANA_ASPECT_RATIO,
  NANO_BANANA_IMAGE_MODEL,
  NANO_BANANA_OUTPUT_FORMAT,
  NANO_BANANA_RESOLUTION,
  normalizeDesignPreset,
  normalizeImageMode,
  normalizeImageProvider,
  normalizeOptionalText
} from "@/lib/marketplace/cardFormValidation";
import { createContentPolicyBlockedResponse } from "@/lib/server/contentPolicyResponse";
import {
  consumeImageGenerationTicket,
  hasValidImageGenerationTicket
} from "@/lib/server/imageGenerationTickets";
import { getEmailVerificationError, getUserForProtectedAction } from "@/lib/server/require-verified-email";
import { consumeGeneration, getUserQuota, refundGeneration, type UserQuota } from "@/lib/server/quota";
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

function applyImageDefaults(input: GenerateImageRequest): GenerateImageRequest {
  return {
    ...input,
    productDescription: input.productDescription?.replace(/\s+/g, " ").trim() ?? "",
    category: normalizeOptionalText(input.category, 120) ?? "",
    marketplace: normalizeOptionalText(input.marketplace, 80) ?? "Wildberries",
    style: normalizeOptionalText(input.style, 80) ?? "Премиальный",
    title: input.title?.replace(/\s+/g, " ").trim() ?? "",
    price: normalizeOptionalText(input.price, 40) || "Цена: по запросу",
    ctaText: normalizeOptionalText(input.ctaText, 80) || "ДОБАВИТЬ В КОРЗИНУ",
    headline: normalizeOptionalText(input.headline, 120),
    designPreset: normalizeDesignPreset(input.designPreset),
    imageProvider: normalizeImageProvider(input.imageProvider),
    imageMode: normalizeImageMode(input.imageMode),
    model: NANO_BANANA_IMAGE_MODEL,
    aspectRatio: NANO_BANANA_ASPECT_RATIO,
    resolution: NANO_BANANA_RESOLUTION,
    outputFormat: NANO_BANANA_OUTPUT_FORMAT
  };
}

export async function POST(request: Request) {
  let userId: string | undefined;
  let billing: ImageGenerationBilling | undefined;

  try {
    const session = await auth();
    userId = session?.user?.id;

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

    const provider = resolveImageProvider(input.imageProvider);
    billing = await assertImageGenerationAllowed(userId, input.imageGenerationTicket);
    const result = await generateProductImageWithProvider(input, {
      provider,
      imageMode: input.imageMode
    });

    if (result.isFallback || (!result.imageBase64 && !result.imageUrl)) {
      console.error("[MarketCard AI] generate-image provider failed:", result.error || "empty image response");

      if (billing.mode === "direct") {
        await refundGeneration(userId);
      }

      const quota = await getUserQuota(userId);

      return NextResponse.json(
        {
          error: IMAGE_GENERATION_RETRY_MESSAGE,
          code: "IMAGE_GENERATION_FAILED",
          generationId: result.generationId,
          imageGenerationTicket: billing.mode === "ticket" ? billing.ticketId : undefined,
          quota
        },
        { status: 502 }
      );
    }

    const quota = await commitImageGeneration(userId, billing);
    return NextResponse.json({ ...result, quota });
  } catch (error) {
    if (billing?.mode === "direct" && billing.preConsumed && userId) {
      await refundGeneration(userId);
    }

    const message = error instanceof Error ? error.message : "Не удалось сгенерировать ИИ-изображение.";
    console.error("[MarketCard AI] generate-image failed:", message);

    if (message === "IMAGE_QUOTA_EXCEEDED") {
      return NextResponse.json(
        {
          error: "Бесплатный лимит использован. Купите комплект, чтобы продолжить.",
          code: "QUOTA_EXCEEDED",
          quota: userId ? await getUserQuota(userId) : undefined
        },
        { status: 402 }
      );
    }

    if (message === "IMAGE_GENERATION_TICKET_INVALID") {
      return NextResponse.json(
        { error: "Сессия генерации истекла. Создайте карточку заново.", code: "IMAGE_GENERATION_TICKET_INVALID" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: IMAGE_GENERATION_RETRY_MESSAGE, code: "IMAGE_GENERATION_FAILED" }, { status: 500 });
  }
}

type ImageGenerationBilling =
  | { mode: "ticket"; ticketId: string }
  | { mode: "direct"; preConsumed: true };

async function assertImageGenerationAllowed(
  userId: string,
  imageGenerationTicket?: string
): Promise<ImageGenerationBilling> {
  const cleanTicketId = imageGenerationTicket?.trim();

  if (cleanTicketId && (await hasValidImageGenerationTicket(cleanTicketId, userId))) {
    return { mode: "ticket", ticketId: cleanTicketId };
  }

  const { consumed, quota } = await consumeGeneration(userId);

  if (!consumed) {
    throw new Error("IMAGE_QUOTA_EXCEEDED");
  }

  return { mode: "direct", preConsumed: true };
}

async function commitImageGeneration(userId: string, billing: ImageGenerationBilling): Promise<UserQuota> {
  if (billing.mode === "direct") {
    return getUserQuota(userId);
  }

  const ticketAccepted = await consumeImageGenerationTicket(billing.ticketId, userId);

  if (!ticketAccepted) {
    throw new Error("IMAGE_GENERATION_TICKET_INVALID");
  }

  const { consumed, quota } = await consumeGeneration(userId);

  if (!consumed) {
    throw new Error("IMAGE_QUOTA_EXCEEDED");
  }

  return quota;
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

  throw new Error("Для ИИ-изображения нужны текст карточки и загруженное фото товара.");
}

function validateGenerateImageInput(input: GenerateImageRequest) {
  if (!input.productDescription.trim() || !input.title.trim()) {
    return "Для ИИ-изображения нужны описание товара и текст карточки.";
  }

  if (!input.imageBase64 || !input.imageMimeType) {
    return "Для ИИ-изображения нужно загруженное фото товара.";
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
