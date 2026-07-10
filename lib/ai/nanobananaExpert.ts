import { buildImagePrompt } from "@/lib/ai/imagePrompt";
import { assessGenerationContentPolicy } from "@/lib/ai/contentPolicy";
import { createImageGenerationError } from "@/lib/ai/imageGenerationErrors";
import type { GenerateImageInput, GenerateImageResult } from "@/types/product-card";

export type NanoBananaExpertBalance = {
  bananas: number;
  generation_coupons: number;
};

type NanoBananaExpertApiResponse = {
  image_url?: string;
  imageUrl?: string;
  url?: string;
  resultImageUrl?: string;
  b64_json?: string;
  b64Json?: string;
  status?: string;
  successFlag?: number;
  bananas_spent?: number;
  used_coupon?: boolean;
  seed?: number;
  generation_id?: string;
  id?: string;
  response?: {
    resultImageUrl?: string;
    originImageUrl?: string;
  };
  data?: NanoBananaExpertApiResponse | NanoBananaExpertApiResponse[];
  result?: NanoBananaExpertApiResponse;
  output?: NanoBananaExpertApiResponse | string | string[];
  images?: string[];
  error?: string;
  message?: string;
};

type ExtractedImageAsset = {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
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

function getPositiveEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
  const prompt = buildImagePrompt(input);
  const generatedAt = new Date().toISOString();

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
    return createImageGenerationError("NanoBanana Expert", prompt, policy.error, generatedAt);
  }

  if (!isApiKeyConfigured()) {
    return createImageGenerationError("NanoBanana Expert", prompt, "NANOBANANA_EXPERT_API_KEY is not configured", generatedAt);
  }

  const referenceImages = input.imageBase64
    ? [
        input.imageBase64.startsWith("data:")
          ? input.imageBase64
          : `data:${input.imageMimeType || "image/png"};base64,${input.imageBase64}`
      ]
    : [];

  return runNanoBananaGeneration({
    prompt,
    referenceImages,
    model: input.model || process.env.NANOBANANA_EXPERT_MODEL || "nb2",
    aspectRatio: input.aspectRatio || process.env.NANOBANANA_EXPERT_ASPECT_RATIO || "4:5",
    resolution: input.resolution || process.env.NANOBANANA_EXPERT_RESOLUTION || "1k",
    outputFormat: input.outputFormat || "png"
  });
}

export type PromptOnlyImageOptions = {
  prompt: string;
  aspectRatio?: string;
  resolution?: "1k" | "2k" | "4k";
  outputFormat?: "png" | "jpeg" | "webp";
  model?: "nb2" | "gpt2";
  /** Проверять только пользовательский текст, не системный AI-промпт на английском */
  contentPolicyText?: string;
  skipContentPolicy?: boolean;
};

export async function generateNanoBananaExpertFromPrompt(
  options: PromptOnlyImageOptions
): Promise<GenerateImageResult> {
  const prompt = options.prompt.trim();
  const generatedAt = new Date().toISOString();

  if (!prompt) {
    return createImageGenerationError("NanoBanana Expert", prompt, "Пустой промпт для изображения.", generatedAt);
  }

  if (!options.skipContentPolicy) {
    const policy = await assessGenerationContentPolicy({
      productDescription: options.contentPolicyText || options.prompt,
      category: "character portrait",
      title: "portrait",
      benefits: [],
      infographicTexts: [],
      keywords: []
    });

    if (!policy.allowed) {
      return createImageGenerationError("NanoBanana Expert", prompt, policy.error, generatedAt);
    }
  }

  if (!isApiKeyConfigured()) {
    return createImageGenerationError("NanoBanana Expert", prompt, "NANOBANANA_EXPERT_API_KEY is not configured", generatedAt);
  }

  return runNanoBananaGeneration({
    prompt,
    referenceImages: [],
    model: options.model || process.env.NANOBANANA_EXPERT_MODEL || "nb2",
    aspectRatio: options.aspectRatio || "3:4",
    resolution: options.resolution || process.env.NANOBANANA_EXPERT_RESOLUTION || "1k",
    outputFormat: options.outputFormat || "png"
  });
}

type NanoBananaGenerationRequest = {
  prompt: string;
  referenceImages: string[];
  model: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string;
};

async function runNanoBananaGeneration(request: NanoBananaGenerationRequest): Promise<GenerateImageResult> {
  const generatedAt = new Date().toISOString();
  const body = {
    prompt: request.prompt,
    reference_images: request.referenceImages,
    model: request.model,
    aspect_ratio: request.aspectRatio,
    resolution: request.resolution,
    output_format: request.outputFormat,
    provider: process.env.NANOBANANA_EXPERT_PROVIDER || "auto"
  };
  const outputFormat = request.outputFormat;

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
      return createImageGenerationError("NanoBanana Expert", request.prompt, errorMessage, generatedAt);
    }

    const data = (await response.json()) as NanoBananaExpertApiResponse;
    const resolvedData = (await resolveNanoBananaImage(data)) ?? data;
    const asset = await hydrateImageAsset(extractImageAsset(resolvedData), outputFormat);

    if (!asset) {
      const generationId = extractGenerationId(data);
      const suffix = generationId ? ` generation_id: ${generationId}` : "";
      return createImageGenerationError("NanoBanana Expert", request.prompt, `Сервис NanoBanana Expert не вернул готовый image_url.${suffix}`, generatedAt);
    }

    const mimeType =
      asset.mimeType ||
      (outputFormat === "jpeg" ? "image/jpeg" : outputFormat === "webp" ? "image/webp" : "image/png");

    return {
      imageBase64: asset.imageBase64 ?? null,
      imageUrl: asset.imageUrl ?? null,
      mimeType,
      provider: "NanoBanana Expert",
      model: body.model,
      prompt: request.prompt,
      generatedAt,
      isFallback: false,
      bananasSpent: resolvedData.bananas_spent ?? data.bananas_spent,
      usedCoupon: resolvedData.used_coupon ?? data.used_coupon,
      generationId: extractGenerationId(resolvedData) ?? extractGenerationId(data),
      seed: resolvedData.seed ?? data.seed
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Сервис NanoBanana Expert временно недоступен";
    return createImageGenerationError("NanoBanana Expert", request.prompt, message, generatedAt);
  }
}

async function resolveNanoBananaImage(initialData: NanoBananaExpertApiResponse) {
  if (extractImageAsset(initialData)) {
    return initialData;
  }

  const generationId = extractGenerationId(initialData);

  if (!generationId) {
    return null;
  }

  const maxPollMs = getPositiveEnvNumber("NANOBANANA_EXPERT_MAX_POLL_MS", 300_000);
  const pollIntervalMs = getPositiveEnvNumber("NANOBANANA_EXPERT_POLL_INTERVAL_MS", 3_000);
  const startedAt = Date.now();

  while (Date.now() - startedAt <= maxPollMs) {
    for (const path of getGenerationStatusPaths(generationId)) {
      try {
        const response = await fetch(`${getBaseUrl()}${path}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getApiKey()}`
          },
          cache: "no-store"
        });

        if (!response.ok) {
          continue;
        }

        const data = (await response.json()) as NanoBananaExpertApiResponse;

        if (extractImageAsset(data)) {
          return data;
        }

        if (isTerminalFailedStatus(data.status) || data.successFlag === 3) {
          return data;
        }
      } catch {
        // Try the next known status route.
      }
    }

    await sleep(pollIntervalMs);
  }

  return null;
}

function getGenerationStatusPaths(generationId: string) {
  const id = encodeURIComponent(generationId);
  return [`/generations/${id}`, `/generation/${id}`, `/generate/${id}`, `/status/${id}`, `/result/${id}`];
}

function extractGenerationId(data: NanoBananaExpertApiResponse): string | undefined {
  if (data.generation_id || data.id) {
    return data.generation_id || data.id;
  }

  if (Array.isArray(data.data)) {
    return extractGenerationId(data.data[0]);
  }

  if (data.data && !Array.isArray(data.data)) {
    return data.data.generation_id || data.data.id;
  }

  return data.result?.generation_id || data.result?.id;
}

function extractImageAsset(data: NanoBananaExpertApiResponse | undefined): ExtractedImageAsset | undefined {
  if (!data) {
    return undefined;
  }

  const directBase64 = data.b64_json || data.b64Json;
  if (directBase64) {
    return {
      imageBase64: stripDataUrlPrefix(directBase64)
    };
  }

  const directUrl =
    data.image_url ||
    data.imageUrl ||
    data.url ||
    data.resultImageUrl ||
    data.response?.resultImageUrl;

  if (directUrl) {
    if (directUrl.startsWith("data:")) {
      const parsed = parseDataUrl(directUrl);
      return {
        imageBase64: parsed.base64,
        mimeType: parsed.mimeType
      };
    }

    return { imageUrl: directUrl };
  }

  if (Array.isArray(data.images) && data.images[0]) {
    return { imageUrl: data.images[0] };
  }

  const output = data.output;
  if (Array.isArray(output) && output[0]) {
    return typeof output[0] === "string" ? { imageUrl: output[0] } : extractImageAsset(output[0]);
  }

  if (typeof output === "string") {
    return output.startsWith("data:")
      ? {
          imageBase64: parseDataUrl(output).base64,
          mimeType: parseDataUrl(output).mimeType
        }
      : { imageUrl: output };
  }

  if (output && !Array.isArray(output) && typeof output === "object") {
    return extractImageAsset(output);
  }

  if (Array.isArray(data.data) && data.data[0]) {
    return extractImageAsset(data.data[0]);
  }

  if (data.data && !Array.isArray(data.data)) {
    return extractImageAsset(data.data);
  }

  if (data.result) {
    return extractImageAsset(data.result);
  }

  return undefined;
}

async function hydrateImageAsset(
  asset: ExtractedImageAsset | undefined,
  outputFormat: string
): Promise<ExtractedImageAsset | undefined> {
  if (!asset) {
    return undefined;
  }

  if (asset.imageBase64) {
    return asset;
  }

  if (!asset.imageUrl) {
    return undefined;
  }

  const downloaded = await downloadRemoteImageAsBase64(asset.imageUrl);

  if (!downloaded) {
    return asset;
  }

  return {
    imageUrl: asset.imageUrl,
    imageBase64: downloaded.base64,
    mimeType: downloaded.mimeType || asset.mimeType || guessMimeType(outputFormat)
  };
}

async function downloadRemoteImageAsBase64(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: "image/*"
      }
    });

    if (!response.ok) {
      return null;
    }

    const mimeType = (response.headers.get("content-type") || "image/png").split(";")[0].trim();
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!buffer.byteLength || buffer.byteLength > 8 * 1024 * 1024) {
      return null;
    }

    return {
      base64: buffer.toString("base64"),
      mimeType
    };
  } catch {
    return null;
  }
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return {
      mimeType: "image/png",
      base64: stripDataUrlPrefix(value)
    };
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function stripDataUrlPrefix(value: string) {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : value;
}

function guessMimeType(outputFormat: string) {
  if (outputFormat === "jpeg") return "image/jpeg";
  if (outputFormat === "webp") return "image/webp";
  return "image/png";
}

function isTerminalFailedStatus(status?: string) {
  return Boolean(status && ["failed", "error", "canceled", "cancelled"].includes(status.toLowerCase()));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
