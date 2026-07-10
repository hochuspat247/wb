import { BRAND } from "@/lib/branding";
import type { KvartovidListingInput } from "@/types/kvartovid";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";

export function buildKvartovidListingPrompt(input: KvartovidListingInput, photoCount: number) {
  const deal = DEAL_TYPE_LABELS[input.dealType];
  const property = PROPERTY_TYPE_LABELS[input.propertyType];

  const lines = [
    `Ты — эксперт по упаковке объявлений о недвижимости в России для ${BRAND.kvartovid}.`,
    "Проанализируй параметры объекта и количество фото. Верни только JSON без markdown.",
    "",
    "Параметры объекта:",
    `- Тип сделки: ${deal}`,
    `- Тип жилья: ${property}`,
    `- Комнат: ${input.rooms}`,
    `- Площадь: ${input.area} м²`,
    input.floor != null ? `- Этаж: ${input.floor}${input.totalFloors ? ` из ${input.totalFloors}` : ""}` : null,
    input.price ? `- Цена: ${input.price}` : null,
    `- Город: ${input.city}`,
    input.district ? `- Район: ${input.district}` : null,
    input.metro ? `- Метро: ${input.metro}` : null,
    input.address ? `- Адрес: ${input.address}` : null,
    input.renovation ? `- Ремонт: ${input.renovation}` : null,
    input.extraFeatures ? `- Дополнительно: ${input.extraFeatures}` : null,
    `- Загружено фото: ${photoCount}`,
    "",
    "Верни JSON:",
    `{`,
    `  "title": "цепляющий заголовок до 80 символов",`,
    `  "description": "продающее описание 800-1200 символов, абзацами, без выдуманных фактов",`,
    `  "advantages": ["4-6 коротких преимуществ для плашки на обложке"],`,
    `  "suggestedHighlights": ["8-12 возможных сильных сторон — пользователь выберет правдивые"],`,
    `  "bestPhotoIndex": 0,`,
    `  "qualityScore": 75,`,
    `  "qualityTips": ["3-5 конкретных советов по улучшению объявления"]`,
    `}`,
    "",
    "Правила:",
    "- Не выдумывай метро, ремонт и инфраструктуру, если не указано.",
    "- bestPhotoIndex — индекс лучшего фото для обложки (0-based), ориентируйся на типичную логику: гостиная/кухня лучше для обложки.",
    "- Тон: живой, конкретный, без канцелярита.",
    "- Язык: русский."
  ];

  return lines.filter(Boolean).join("\n");
}

export function buildKvartovidCoverPrompt(input: KvartovidListingInput, title: string, advantages: string[]) {
  const deal = DEAL_TYPE_LABELS[input.dealType];
  const property = PROPERTY_TYPE_LABELS[input.propertyType];
  const overlay = advantages.slice(0, 4).join(" · ");

  return [
    `Real estate listing cover photo for Russian marketplace (${deal}, ${property}).`,
    `Improve lighting and composition of the apartment interior photo.`,
    `Add a clean modern overlay badge with short Russian text highlights.`,
    `Headline on cover: ${title}`,
    `Badge highlights: ${overlay}`,
    `Style: bright, trustworthy, premium real estate ad, no watermark, no stock look.`,
    `Keep the room recognizable; enhance exposure and warmth slightly.`,
    `Text must be readable, short lines, elegant sans-serif.`,
    `City context: ${input.city}${input.district ? `, ${input.district}` : ""}.`
  ].join(" ");
}
