import { DEMO_GENERATION_ERROR, parseJsonResponse } from "@/lib/api/parseJsonResponse";
import { getImageSettings } from "@/lib/imageSettings";
import { getOrCreateGuestId } from "@/lib/guest";
import { dataUrlToBase64 } from "@/lib/image";
import type { ProductCardInput } from "@/types/product-card";
import type { ImageDesignPreset, ImageGenerationMode } from "@/types/product-card";

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

type SubmitHeroDemoInput = {
  imageUrl: string;
  payload: ProductCardInput;
  imageMode?: ImageGenerationMode;
  designPreset?: ImageDesignPreset;
};

export async function submitHeroDemo({
  imageUrl,
  payload,
  imageMode = "pro",
  designPreset = "premium-marketplace"
}: SubmitHeroDemoInput) {
  const image = dataUrlToBase64(imageUrl);
  const guestId = getOrCreateGuestId();
  const response = await fetch("/api/generations/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guestId,
      cardInput: {
        ...payload,
        cardsCount: 1
      },
      imageBase64: image.base64,
      imageMimeType: image.mimeType,
      imageProvider: getImageSettings().imageProvider,
      imageMode,
      designPreset
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
