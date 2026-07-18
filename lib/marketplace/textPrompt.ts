import { getPlatformProfile } from "@/lib/marketplace/platformProfiles";
import { buildEditInstructionsBlock } from "@/lib/series/editing";
import type { MarketplaceTextInput } from "@/types/marketplace";

const MODE_LABELS: Record<MarketplaceTextInput["mode"], string> = {
  marketplace_safe: "Безопасно для модерации (marketplace_safe)",
  promo_creative: "Промо-креатив (promo_creative)",
  seo: "SEO-описание (seo)",
  full_listing: "Полная карточка (full_listing)"
};

function formatInputFields(input: MarketplaceTextInput): string {
  const lines: string[] = [
    `Описание товара (факты): ${input.productDescription}`,
    `Категория: ${input.category}`,
    `Режим текста: ${MODE_LABELS[input.mode]}`
  ];

  if (input.identifiedProductName) {
    lines.push(
      `КАНОНИЧЕСКОЕ НАЗВАНИЕ ТОВАРА (обязательно): ${input.identifiedProductName}`,
      "Во всех title / shortTitle / wbName / ozonName / avitoTitle / yandexName используй ЭТО название товара.",
      "ЗАПРЕЩЕНО подменять товар другим (например писать «теннисные мячи», если товар — воздушный шар).",
      "Не выдумывай бренд, комплектность и характеристики, которых нет во входных данных."
    );
  }

  if (input.sellerWishes?.trim()) {
    lines.push(
      `Пожелания продавца к карточке: ${input.sellerWishes.trim()}`,
      "ВАЖНО: пожелания продавца не заменяют товар. Пиши про товар с фото, а пожелания используй только как акценты подачи."
    );
  }

  const optional: [string, string | undefined][] = [
    ["Бренд", input.brand],
    ["Артикул продавца", input.sellerSku],
    ["Цвет", input.color],
    ["Размер", input.size],
    ["Материал", input.material],
    ["Габариты", input.dimensions],
    ["Вес", input.weight],
    ["Комплектация", input.packageContents],
    ["Целевая аудитория", input.targetAudience],
    ["Сценарий использования", input.useCase],
    ["Цена", input.price],
    ["Старая цена", input.oldPrice],
    ["Скидка", input.discount]
  ];

  for (const [label, value] of optional) {
    if (value?.trim()) {
      lines.push(`${label}: ${value.trim()}`);
    }
  }

  if (input.advantages?.length) {
    lines.push(`Преимущества (от продавца): ${input.advantages.join("; ")}`);
  }

  if (input.characteristics?.length) {
    lines.push(
      `Характеристики (от продавца): ${input.characteristics
        .filter((item): item is { key: string; value: string } => Boolean(item && (item.key || item.value)))
        .map((c) => `${c.key}: ${c.value}`)
        .join("; ")}`
    );
  }

  if (input.keywords?.length) {
    lines.push(`Ключевые слова (от продавца): ${input.keywords.join(", ")}`);
  }

  return lines.join("\n");
}

function allPlatformsPrompt(input: MarketplaceTextInput): string {
  const wbProfile = getPlatformProfile("wildberries");
  const ymProfile = getPlatformProfile("yandex_market");

  return `
Сгенерируй тексты сразу для всех площадок: Wildberries, Ozon, Avito и Яндекс Маркет.
Основная площадка пользователя: ${getPlatformProfile(input.platform).displayName}.

Общие правила:
- не выдумывай свойства, которых нет во входных данных
- если свойство неизвестно, формулируй нейтрально или опусти
- не используй слова «премиум» / «премиальный», если их нет во входных данных
- заполни platformSpecific.wildberries, platformSpecific.ozon, platformSpecific.avito и platformSpecific.yandexMarket полностью
- title и названия площадок должны описывать ТОТ ЖЕ товар, что в каноническом названии / описании
- infographicTexts: короткие фразы без опечаток, без выдуманных слов, максимум 28 символов на фразу
- заголовки короткие: title до 60 символов, shortTitle до 40

Wildberries:
- короткое точное наименование, описание без воды, safe-тексты для инфографики
- не добавляй в title: ${wbProfile.forbiddenTitleWords.map((w) => `"${w}"`).join(", ")}
- wbSafeImageTexts: короткие фразы о свойствах товара
- wbForbiddenImageTexts: что нельзя писать на изображении

Ozon:
- ozonName, ozonAnnotation, ozonDescription
- ozonRichContentBlocks: минимум 3 блока («Почему стоит купить», «Сценарии использования», «Что в комплекте»)
- ozonMediaTips: рекомендации по фото и инфографике

Avito:
- avitoTitle, avitoDescription, avitoPriceBlock, avitoBenefits, avitoCallToAction
- avitoQuestionsAnswers: минимум 3 пары вопрос-ответ
- avitoPriceBlock: ${input.price ? `используй цену ${input.price}` : "укажи, что цену нужно уточнить, если не передана"}

Яндекс Маркет:
- yandexName: тип товара + бренд/модель + важные характеристики
- yandexSafeImageTexts: короткие нейтральные фразы
- yandexForbiddenImageTexts: что нельзя писать на фото
- imageTexts в marketplace_safe не должны содержать: ${ymProfile.forbiddenSafeImageWords.map((w) => `"${w}"`).join(", ")}

${input.mode === "promo_creative" ? "- В promo_creative можно продающие плашки, но добавь moderationWarnings о проверке правил площадки" : ""}
${input.mode === "marketplace_safe" ? "- Строго safe-режим: никаких цен, скидок и CTA на imageTexts и safe-текстах для фото" : ""}
`;
}

const JSON_SCHEMA = `{
  "title": "string",
  "shortTitle": "string",
  "seoTitle": "string",
  "shortDescription": "string",
  "fullDescription": "string",
  "advantages": ["string"],
  "characteristics": [{"key":"string","value":"string"}],
  "keywords": ["string"],
  "imageTexts": ["string"],
  "infographicTexts": ["string"],
  "platformFields": {
    "category": "string",
    "brand": "string",
    "sellerSku": "string",
    "color": "string",
    "size": "string",
    "material": "string",
    "dimensions": "string",
    "weight": "string",
    "packageContents": "string"
  },
  "platformSpecific": {
    "wildberries": null,
    "ozon": null,
    "avito": null,
    "yandexMarket": null
  },
  "moderationWarnings": ["string"],
  "improvementTips": ["string"],
  "exportChecklist": ["string"]
}`;

const WB_SPECIFIC_SCHEMA = `{
  "wbName": "string",
  "wbDescription": "string",
  "wbCharacteristics": [{"key":"string","value":"string"}],
  "wbPhotoRules": ["string"],
  "wbSafeImageTexts": ["string"],
  "wbForbiddenImageTexts": ["string"],
  "wbQualityTips": ["string"]
}`;

const OZON_SPECIFIC_SCHEMA = `{
  "ozonName": "string",
  "ozonAnnotation": "string",
  "ozonDescription": "string",
  "ozonRichContentBlocks": [{"title":"string","text":"string"}],
  "ozonCharacteristics": [{"key":"string","value":"string"}],
  "ozonMediaTips": ["string"]
}`;

const AVITO_SPECIFIC_SCHEMA = `{
  "avitoTitle": "string",
  "avitoDescription": "string",
  "avitoPriceBlock": "string",
  "avitoBenefits": ["string"],
  "avitoCallToAction": "string",
  "avitoDeliveryText": "string",
  "avitoQuestionsAnswers": [{"question":"string","answer":"string"}]
}`;

const YANDEX_SPECIFIC_SCHEMA = `{
  "yandexName": "string",
  "yandexDescription": "string",
  "yandexCharacteristics": [{"key":"string","value":"string"}],
  "yandexImageRules": ["string"],
  "yandexSafeImageTexts": ["string"],
  "yandexForbiddenImageTexts": ["string"],
  "yandexQualityTips": ["string"]
}`;

export function buildMarketplaceTextPrompt(input: MarketplaceTextInput): string {
  const profile = getPlatformProfile(input.platform);
  const editBlock = buildEditInstructionsBlock(input.editInstructions, input.previousCard);

  return `Ты маркетолог маркетплейсов и специалист по созданию карточек товара.
На основе данных товара подготовь текстовые данные карточки сразу для всех площадок.
Платформа влияет на структуру, стиль, ограничения и итоговый JSON.
Не выдумывай свойства, которых нет во входных данных.
Если свойство неизвестно, формулируй нейтрально.
Не используй запрещённые обещания.
Не используй медицинские, юридические или гарантированные заявления.
Пользователь должен получить только готовый продающий контент про товар, без служебных пояснений.
Никогда не пиши в title, descriptions, advantages, keywords, imageTexts и platformSpecific описаниях фразы: "нейтральное описание", "без рекламных обещаний", "для карточки Wildberries", "текст для маркетплейса", "польза сформулирована", "товар для маркетплейса".
advantages должны описывать только сам товар: свойства, пользу, комплект, сценарии, материалы, совместимость. Не пиши про качество генерации, дизайна, карточки, текста, SEO, инфографики или подачи.
keywords должны относиться только к товару и категории. Не добавляй "товар", "товары для маркетплейса", "маркетплейс", "Wildberries", "Ozon", "WB", "Avito", "Яндекс Маркет", если это не часть реального названия товара.
Верни только валидный JSON без markdown.

Основная площадка: ${profile.displayName}
Режим: ${MODE_LABELS[input.mode]}
Подсказка режима: ${profile.modeHints[input.mode]}

Входные данные:
${formatInputFields(input)}

${allPlatformsPrompt(input)}

Верни строго такой JSON:
${JSON_SCHEMA}

Для platformSpecific заполни все четыре блока по схемам:
wildberries -> ${WB_SPECIFIC_SCHEMA}
ozon -> ${OZON_SPECIFIC_SCHEMA}
avito -> ${AVITO_SPECIFIC_SCHEMA}
yandexMarket -> ${YANDEX_SPECIFIC_SCHEMA}${editBlock}`;
}
