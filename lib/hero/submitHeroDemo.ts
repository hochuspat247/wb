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

type SubmitHeroDemoInput = {
  imageUrl: string;
  payload: ProductCardInput;
  designPreset?: ImageDesignPreset;
  antiBot?: AntiBotPayload;
};

export async function submitHeroDemo({
  imageUrl,
  payload,
  designPreset = "premium-marketplace",
  antiBot
}: SubmitHeroDemoInput) {
  const image = dataUrlToBase64(imageUrl);
  const guestId = getOrCreateGuestId();
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
  const data = await parseJsonResponse<{ id?: string; error?: string }>(response);

  if (!response.ok || !data.id) {
    throw new Error(data.error || DEMO_GENERATION_ERROR);
  }

  return {
    generationId: data.id,
    guestId
  };
}
