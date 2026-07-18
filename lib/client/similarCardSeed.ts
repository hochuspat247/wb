import { resolveProductImagePayload } from "@/lib/client/generateCarouselCards";
import type { ProductCardResult } from "@/types/product-card";

/** Keep layout/blocks 1:1 while swapping product photo + description. */
export const SIMILAR_CARD_LAYOUT_INSTRUCTIONS =
  "Новая карточка для нового товара по описанию и фото. Сохрани композицию, блоки и плашки 1 в 1 как в образце. Замени только товар, тексты и акценты. Не копируй старое название.";

export function resolveSimilarCardDescription(card: ProductCardResult) {
  const fromSource = card.sourceInput?.productDescription?.trim();
  if (fromSource) return fromSource;

  const fromFull = card.fullDescription?.trim();
  if (fromFull) return fromFull;

  const fromShort = card.shortDescription?.trim();
  if (fromShort) return fromShort;

  return card.title?.trim() || "";
}

export function resolveSimilarCardPhoto(card: ProductCardResult) {
  const payload = resolveProductImagePayload(card);
  if (payload?.dataUrl) {
    return {
      imageUrl: payload.dataUrl,
      imageFileName: card.sourceInput?.imageFileName || "Фото из похожей карточки"
    };
  }

  if (card.imageDataUrl) {
    return {
      imageUrl: card.imageDataUrl,
      imageFileName: "Фото из похожей карточки"
    };
  }

  return null;
}

export function getSimilarCardTitle(card: ProductCardResult) {
  return card.title?.trim() || card.shortDescription?.trim() || "похожей карточки";
}
