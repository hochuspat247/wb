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
    `  "qualityTips": ["3-5 конкретных советов по улучшению объявления"],`,
    `  "platformTexts": {`,
    `    "avito": {`,
    `      "title": "заголовок для Авито — живой, цепляющий",`,
    `      "description": "600-900 символов, разговорный продающий тон, метро и преимущества в первых строках"`,
    `    },`,
    `    "cian": {`,
    `      "title": "заголовок для Циан — конкретный и спокойный",`,
    `      "description": "700-1000 символов, структурно: объект → параметры → инфраструктура → условия сделки"`,
    `    },`,
    `    "domclick": {`,
    `      "title": "заголовок для Домклик — официальный",`,
    `      "description": "600-900 символов, деловой стиль без эмодзи и пустых обещаний"`,
    `    }`,
    `  }`,
    `}`,
    "",
    "Правила:",
    "- Не выдумывай метро, ремонт и инфраструктуру, если не указано.",
    "- bestPhotoIndex — индекс лучшего фото для обложки (0-based), ориентируйся на типичную логику: гостиная/кухня лучше для обложки.",
    "- title и description — универсальная версия; platformTexts — адаптации под площадки.",
    "- Авито: живой текст, можно короткие абзацы, акцент на выгоду.",
    "- Циан: спокойнее, логичные блоки, меньше восклицаний.",
    "- Домклик: официально, как описание от агентства или банка.",
    "- Тон: живой, конкретный, без канцелярита.",
    "- Язык: русский."
  ];

  return lines.filter(Boolean).join("\n");
}

