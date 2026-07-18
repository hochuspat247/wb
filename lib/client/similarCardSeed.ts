import { resolveProductImagePayload } from "@/lib/client/generateCarouselCards";
import { buildSeriesStyleGuide } from "@/lib/series/plan";
import type { ProductCardResult } from "@/types/product-card";

/** Marker so image prompt can switch into layout-lock mode. */
export const SIMILAR_LAYOUT_LOCK_MARKER = "LAYOUT_LOCK_FROM_SAMPLE";

export function getSimilarCardTitle(card: ProductCardResult) {
  return card.title?.trim() || card.shortDescription?.trim() || "похожей карточки";
}

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

/** Strong instructions so text + image keep the sample card's visual system. */
export function buildSimilarLayoutInstructions(card: ProductCardResult) {
  const style = card.style || card.sourceInput?.style || "Премиальный";
  const marketplace = card.marketplace || card.sourceInput?.marketplace || "Wildberries";
  const designPreset = card.designPreset || card.sourceInput?.designPreset || "premium-marketplace";
  const visualConcept = card.visualConcept?.trim() || "премиальная карточка 4:5 с крупным товаром и аккуратными плашками";
  const benefits = (card.benefits || []).slice(0, 4).join("; ") || "короткие плашки преимуществ";
  const specs = (card.characteristics || [])
    .slice(0, 4)
    .map((item) => `${item.key}: ${item.value}`)
    .join("; ");
  const infographic = (card.infographicTexts || []).slice(0, 4).join("; ");
  const styleGuide =
    card.seriesStyleGuide?.trim() || buildSeriesStyleGuide(style, marketplace);

  return `${SIMILAR_LAYOUT_LOCK_MARKER}
Сделай НОВУЮ карточку для текущего товара/фото, но визуально 1 в 1 как образец.

ОБЯЗАТЕЛЬНО сохранить:
- ту же композицию и сетку блоков (где заголовок, товар, плашки, бейджи);
- ту же плотность текста и типографику;
- ту же палитру, фон, характер теней и «дорогой» e-commerce вайб;
- тот же design preset / стиль оформления.

МОЖНО менять только:
- сам товар по загруженному фото;
- тексты под новый товар;
- акцентные цвета под новый товар, если нужно.

НЕЛЬЗЯ:
- менять тип раскладки (не превращать карточку в другой шаблон);
- добавлять новые блоки, которых не было в образце;
- убирать ключевые плашки/структуру образца;
- копировать старое название товара дословно.

Образец:
Стиль: ${style}
Площадка: ${marketplace}
Пресет: ${designPreset}
Гид стиля: ${styleGuide}
Визуальная концепция: ${visualConcept}
Структура преимуществ: ${benefits}
${specs ? `Характеристики в образце: ${specs}` : ""}
${infographic ? `Инфографика в образце: ${infographic}` : ""}`;
}

/** @deprecated use buildSimilarLayoutInstructions(card) */
export const SIMILAR_CARD_LAYOUT_INSTRUCTIONS =
  "Новая карточка для нового товара по описанию и фото. Сохрани композицию, блоки и плашки 1 в 1 как в образце. Замени только товар, тексты и акценты. Не копируй старое название.";
