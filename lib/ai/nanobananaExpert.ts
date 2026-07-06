import { buildPremiumMarketplaceImagePrompt } from "@/lib/ai/imagePrompt";
import type { GenerateImageInput, GenerateImageResult } from "@/types/product-card";

export type NanoBananaExpertBalance = {
  bananas: number;
  generation_coupons: number;
};

type NanoBananaExpertApiResponse = {
  image_url?: string;
  bananas_spent?: number;
  used_coupon?: boolean;
  seed?: number;
  generation_id?: string;
  error?: string;
  message?: string;
};

function getBaseUrl() {
  return process.env.NANOBANANA_EXPERT_BASE_URL || "https://nanobanana.expert/api/v1";
}

function getApiKey() {
  return process.env.NANOBANANA_EXPERT_API_KEY?.trim() || "";
}

function isApiKeyConfigured() {
  return Boolean(getApiKey());
}

export function isNanoBananaExpertConfigured() {
  return isApiKeyConfigured();
}

export async function checkNanoBananaExpertBalance(): Promise<
  { ok: true; data: NanoBananaExpertBalance } | { ok: false; error: string }
> {
  if (!isApiKeyConfigured()) {
    return { ok: false, error: "NANOBANANA_EXPERT_API_KEY is not configured" };
  }

  try {
    const response = await fetch(`${getBaseUrl()}/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getApiKey()}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const message = await readApiErrorMessage(response);
      return { ok: false, error: message };
    }

    const data = (await response.json()) as NanoBananaExpertBalance;
    return {
      ok: true,
      data: {
        bananas: Number(data.bananas ?? 0),
        generation_coupons: Number(data.generation_coupons ?? 0)
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не удалось получить баланс NanoBanana Expert"
    };
  }
}

export async function generateNanoBananaExpertImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const prompt = buildPremiumMarketplaceImagePrompt(input);
  const generatedAt = new Date().toISOString();

  if (!isApiKeyConfigured()) {
    return createFallbackResult(prompt, "NANOBANANA_EXPERT_API_KEY is not configured", generatedAt);
  }

  const body = {
    prompt,
    reference_images: input.imageBase64
      ? [
          input.imageBase64.startsWith("data:")
            ? input.imageBase64
            : `data:${input.imageMimeType || "image/png"};base64,${input.imageBase64}`
        ]
      : [],
    model: input.model || process.env.NANOBANANA_EXPERT_MODEL || "nb2",
    aspect_ratio: input.aspectRatio || process.env.NANOBANANA_EXPERT_ASPECT_RATIO || "4:5",
    resolution: input.resolution || process.env.NANOBANANA_EXPERT_RESOLUTION || "1k",
    output_format: input.outputFormat || "png",
    provider: process.env.NANOBANANA_EXPERT_PROVIDER || "auto"
  };

  const outputFormat = input.outputFormat || "png";

  try {
    const response = await fetch(`${getBaseUrl()}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorMessage = mapStatusToError(response.status, await readApiErrorMessage(response));
      return createFallbackResult(prompt, errorMessage, generatedAt);
    }

    const data = (await response.json()) as NanoBananaExpertApiResponse;

    if (!data.image_url) {
      return createFallbackResult(prompt, "Сервис NanoBanana Expert не вернул image_url", generatedAt);
    }

    const mimeType = outputFormat === "jpeg" ? "image/jpeg" : outputFormat === "webp" ? "image/webp" : "image/png";

    return {
      imageBase64: null,
      imageUrl: data.image_url,
      mimeType,
      provider: "NanoBanana Expert",
      model: body.model,
      prompt,
      generatedAt,
      isFallback: false,
      bananasSpent: data.bananas_spent,
      usedCoupon: data.used_coupon,
      generationId: data.generation_id,
      seed: data.seed
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Сервис NanoBanana Expert временно недоступен";
    return createFallbackResult(prompt, message, generatedAt);
  }
}

function createFallbackResult(prompt: string, error: string, generatedAt: string): GenerateImageResult {
  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider: "HTML/CSS fallback",
    model: "fallback",
    prompt,
    generatedAt,
    isFallback: true,
    error
  };
}

async function readApiErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function mapStatusToError(status: number, fallback: string) {
  switch (status) {
    case 400:
      return "Ошибка параметров запроса";
    case 401:
      return "Неверный API-ключ NanoBanana Expert";
    case 402:
      return "Недостаточно banana-баланса для генерации изображения";
    case 403:
      return "Аккаунт NanoBanana Expert заблокирован или нет доступа";
    case 429:
      return "Слишком много запросов, попробуйте позже";
    case 500:
    case 503:
      return "Сервис NanoBanana Expert временно недоступен";
    default:
      return fallback || "Сервис NanoBanana Expert временно недоступен";
  }
}
