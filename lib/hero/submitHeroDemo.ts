import { DEMO_GENERATION_ERROR, parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { getImageSettings } from "@/lib/imageSettings";
import { getOrCreateGuestId } from "@/lib/guest";
import { dataUrlToBase64 } from "@/lib/image";
import { normalizeDesignPreset, normalizeProductCardInput, resolveNanoBananaImageProvider } from "@/lib/marketplace/cardFormValidation";
import type { AntiBotPayload } from "@/lib/server/botProtection";
import type { ProductCardInput } from "@/types/product-card";
import type { ImageDesignPreset } from "@/types/product-card";

export const HERO_DEMO_LOADING_STATUSES = [
  "Загружаем фото",
  "Определяем товар",
  "Подбираем стиль и фон",
  "Формируем текст и акценты",
  "Собираем карточку",
  "Наносим демо-метку",
  "Проверяем результат",
  "Осталось чуть-чуть",
  "Делаем последние штрихи"
];

export const HERO_DEMO_MIN_LOADING_MS = 20_000;
export const HERO_DEMO_PROGRESS_DURATION_MS = 280_000;

/** Recover demos that finished after the browser timed out (last 30 minutes). */
const DEMO_RECOVERY_MAX_AGE_MS = 30 * 60 * 1000;

type SubmitHeroDemoInput = {
  imageUrl: string;
  payload: ProductCardInput;
  designPreset?: ImageDesignPreset;
  antiBot?: AntiBotPayload;
};

type DemoApiResponse = {
  id?: string;
  existingDemoId?: string;
  error?: string;
  code?: string;
};

function isTransientDemoFailure(message: string) {
  return /слишком много времени|временно недоступен|failed to fetch|networkerror|load failed|попробуйте ещё раз|не получилось создать карточку/i.test(
    message
  );
}

export async function fetchLatestGuestDemoId(
  guestId: string,
  options?: { maxAgeMs?: number }
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ guestId });
    if (options?.maxAgeMs) {
      params.set("maxAgeMs", String(options.maxAgeMs));
    }

    const response = await fetch(`/api/generations/demo/latest?${params.toString()}`, {
      headers: { "x-marketcard-guest-id": guestId },
      cache: "no-store"
    });

    if (!response.ok) return null;

    const data = await parseJsonResponse<{ id?: string }>(response, DEMO_GENERATION_ERROR);
    return data.id || null;
  } catch {
    return null;
  }
}

export async function submitHeroDemo({
  imageUrl,
  payload,
  designPreset = "premium-marketplace",
  antiBot
}: SubmitHeroDemoInput) {
  const image = dataUrlToBase64(imageUrl);
  const guestId = getOrCreateGuestId();

  try {
    const response = await fetch("/api/generations/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestId,
        cardInput: normalizeProductCardInput(payload),
        imageBase64: image.base64,
        imageMimeType: image.mimeType,
        imageProvider: resolveNanoBananaImageProvider(getImageSettings().imageProvider),
        designPreset: normalizeDesignPreset(designPreset),
        ...antiBot
      })
    });

    const data = await parseJsonResponse<DemoApiResponse>(response);

    const existingId = data.existingDemoId || (data.code === "DEMO_LIMIT_EXCEEDED" ? data.id : undefined);
    if (existingId) {
      return {
        generationId: existingId,
        guestId,
        reused: true as const
      };
    }

    if (!response.ok || !data.id) {
      if (data.code === "DEMO_LIMIT_EXCEEDED") {
        const recoveredId = await fetchLatestGuestDemoId(guestId);
        if (recoveredId) {
          return { generationId: recoveredId, guestId, reused: true as const };
        }
      }
      throw new Error(data.error || DEMO_GENERATION_ERROR);
    }

    return {
      generationId: data.id,
      guestId,
      reused: false as const
    };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : DEMO_GENERATION_ERROR;

    if (isTransientDemoFailure(message)) {
      const recoveredId = await fetchLatestGuestDemoId(guestId, { maxAgeMs: DEMO_RECOVERY_MAX_AGE_MS });
      if (recoveredId) {
        return { generationId: recoveredId, guestId, reused: true as const };
      }
    }

    throw caught instanceof Error ? caught : new Error(DEMO_GENERATION_ERROR);
  }
}
