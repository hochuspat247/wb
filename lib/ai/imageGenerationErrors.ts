import type { GenerateImageResult } from "@/types/product-card";

export const IMAGE_GENERATION_RETRY_MESSAGE =
  "Ошибка связи с интернетом. Повторите генерацию — списание не произойдёт.";

export function getImageGenerationRetryMessage(_error?: string | null) {
  return IMAGE_GENERATION_RETRY_MESSAGE;
}

function extractErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? "unknown error");
}

export function isGeminiQuotaError(message: string) {
  return /RESOURCE_EXHAUSTED|quota exceeded|free_tier|"code":\s*429|\b429\b/i.test(message);
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isPromptImageGeminiFallbackEnabled() {
  if (process.env.PROMPT_IMAGE_GEMINI_FALLBACK === "true") {
    return true;
  }

  if (process.env.PROMPT_IMAGE_GEMINI_FALLBACK === "false") {
    return false;
  }

  return false;
}

export function formatImageProviderError(error: unknown) {
  const raw = extractErrorText(error).trim();

  if (!raw) {
    return "Сервис генерации изображений временно недоступен.";
  }

  if (isGeminiQuotaError(raw)) {
    return "Исчерпана квота Gemini API. Подключите оплату в Гугл ИИ Студио или используйте NanoBanana Expert (NANOBANANA_EXPERT_API_KEY).";
  }

  if (/NANOBANANA_EXPERT_API_KEY is not configured/i.test(raw)) {
    return "Не настроен NanoBanana Expert. Добавьте NANOBANANA_EXPERT_API_KEY в .env.";
  }

  if (/Недостаточно banana-баланса/i.test(raw)) {
    return "Недостаточно баланса NanoBanana Expert для генерации изображения.";
  }

  if (/GEMINI_API_KEY не задан/i.test(raw)) {
    return "GEMINI_API_KEY не задан.";
  }

  if (raw.startsWith("{") || raw.length > 220) {
    return "Сервис генерации изображений временно недоступен. Попробуйте позже или проверьте настройки провайдера.";
  }

  return raw;
}

export function summarizeImageGenerationErrors(errors: Array<string | undefined | null>) {
  const formatted = errors
    .filter(Boolean)
    .map((error) => formatImageProviderError(error))
    .filter((error, index, list) => list.indexOf(error) === index);

  if (!formatted.length) {
    return "Не удалось сгенерировать изображение. Проверьте настройки провайдера изображений.";
  }

  if (formatted.length === 1) {
    return formatted[0];
  }

  return formatted.join(" ");
}

export function createImageGenerationError(
  provider: string,
  prompt: string,
  error: string,
  generatedAt = new Date().toISOString(),
  generationId?: string
): GenerateImageResult {
  return {
    imageBase64: null,
    imageUrl: null,
    mimeType: null,
    provider,
    model: "error",
    prompt,
    generatedAt,
    isFallback: true,
    error: formatImageProviderError(error),
    generationId: generationId || undefined
  };
}

/** Pull provider job id from stored error text when the field was lost. */
export function extractProviderGenerationId(errorOrText?: string | null) {
  if (!errorOrText) {
    return undefined;
  }

  const match = errorOrText.match(/generation_id:\s*([A-Za-z0-9_-]+)/i);
  return match?.[1]?.trim() || undefined;
}
