import { getPlatformProfile } from "@/lib/marketplace/platformProfiles";
import type { MarketplaceTextInput } from "@/types/marketplace";

const MODE_LABELS: Record<MarketplaceTextInput["mode"], string> = {
  marketplace_safe: "Безопасно для модерации (marketplace_safe)",
  promo_creative: "Промо-креатив (promo_creative)",
  seo: "SEO-описание (seo)",
  full_listing: "Полная карточка (full_listing)"
};

function formatInputFields(input: MarketplaceTextInput): string {
  const lines: string[] = [
    `Описание товара: ${input.productDescription}`,
    `Категория: ${input.category}`,
    `Режим текста: ${MODE_LABELS[input.mode]}`
  ];

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
      `Характеристики (от продавца): ${input.characteristics.map((c) => `${c.key}: ${c.value}`).join("; ")}`
    );
  }

  if (input.keywords?.length) {
    lines.push(`Ключевые слова (от продавца): ${input.keywords.join(", ")}`);
  }

  return lines.join("\n");
}

function wildberriesPrompt(input: MarketplaceTextInput): string {
  const profile = getPlatformProfile("wildberries");
  return `
Платформа: Wildberries.
Сгенерируй данные карточки товара под WB.

Главный фокус:
- короткое точное наименование
- описание без воды
- характеристики по категории
- преимущества товара
- подсказки по качеству карточки
- safe-тексты для инфографики без запрещённых слов

Правила для WB:
- title должен быть коротким и точным
- не добавляй в title: ${profile.forbiddenTitleWords.map((w) => `"${w}"`).join(", ")}
- не добавляй цену в title
- не добавляй эмодзи
- imageTexts в marketplace_safe режиме не должны содержать цену, скидку, CTA, "хит", "лучший", "топ"
- wbSafeImageTexts должны быть короткими фразами о свойствах товара
- wbForbiddenImageTexts должны перечислять, что нельзя писать на изображении
- exportChecklist должен содержать список, что проверить перед загрузкой на WB
${input.mode === "promo_creative" ? "- В promo_creative можно продающие плашки, но добавь moderationWarnings о том, что это не safe для модерации WB" : ""}
${input.mode === "marketplace_safe" ? "- Строго соблюдай safe-режим: никаких цен, скидок, CTA на imageTexts и wbSafeImageTexts" : ""}

Заполни platformSpecific.wildberries полностью. Остальные platformSpecific поля — null.
`;
}

function ozonPrompt(input: MarketplaceTextInput): string {
  return `
Платформа: Ozon.
Сгенерируй данные карточки товара под Ozon.

Главный фокус:
- информативное название
- аннотация
- полное описание
- rich-content блоки
- характеристики
- медиа-рекомендации

Правила для Ozon:
- ozonName должен быть понятным и товарным
- ozonAnnotation должна кратко объяснять ценность товара
- ozonRichContentBlocks должны быть готовы для расширенного описания (минимум 3 блока: «Почему стоит купить», «Сценарии использования», «Что в комплекте»)
- ozonMediaTips должны объяснять, какие изображения и инфографику добавить
- текст должен быть структурным и полезным для покупателя
- не выдумывать свойства, которых нет во входных данных
- не делать слишком короткое описание

Заполни platformSpecific.ozon полностью. Остальные platformSpecific поля — null.
`;
}

function avitoPrompt(input: MarketplaceTextInput): string {
  return `
Платформа: Avito.
Сгенерируй не карточку маркетплейса, а объявление.

Главный фокус:
- цепкий, но честный заголовок
- понятное описание
- цена/условия
- преимущества
- CTA
- ответы на частые вопросы

Правила для Avito:
- avitoTitle должен быть живым и понятным
- avitoDescription должен звучать как реальное объявление
- можно использовать более прямой продающий стиль
- можно упоминать цену, доставку, самовывоз, наличие
- avitoPriceBlock: ${input.price ? `используй цену ${input.price}` : "укажи, что цену нужно уточнить, если не передана"}
- avitoQuestionsAnswers должны закрывать типовые вопросы покупателя (минимум 3 пары)
- avitoCallToAction: призыв написать продавцу
- не писать слишком официальный маркетинговый текст

Заполни platformSpecific.avito полностью. Остальные platformSpecific поля — null.
`;
}

function yandexMarketPrompt(input: MarketplaceTextInput): string {
  const profile = getPlatformProfile("yandex_market");
  return `
Платформа: Яндекс Маркет.
Сгенерируй данные карточки под Яндекс Маркет.

Главный фокус:
- информативное название
- описание
- характеристики
- безопасные тексты для фото
- подсказки по качеству карточки

Правила для Яндекс Маркета:
- yandexName: тип товара + бренд/модель + важные характеристики
- не перегружать title ключами
- imageTexts в marketplace_safe режиме не должны содержать: ${profile.forbiddenSafeImageWords.map((w) => `"${w}"`).join(", ")}
- yandexSafeImageTexts должны быть короткими и нейтральными
- yandexForbiddenImageTexts должны перечислять, что нельзя писать на фото
- exportChecklist должен помогать подготовить товар к загрузке
${input.mode === "marketplace_safe" ? "- Строго safe-режим для фото" : ""}

Заполни platformSpecific.yandexMarket полностью. Остальные platformSpecific поля — null.
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

  let platformBlock = "";
  let specificSchema = "";

  switch (input.platform) {
    case "wildberries":
      platformBlock = wildberriesPrompt(input);
      specificSchema = WB_SPECIFIC_SCHEMA;
      break;
    case "ozon":
      platformBlock = ozonPrompt(input);
      specificSchema = OZON_SPECIFIC_SCHEMA;
      break;
    case "avito":
      platformBlock = avitoPrompt(input);
      specificSchema = AVITO_SPECIFIC_SCHEMA;
      break;
    case "yandex_market":
      platformBlock = yandexMarketPrompt(input);
      specificSchema = YANDEX_SPECIFIC_SCHEMA;
      break;
  }

  return `Ты маркетолог маркетплейсов и специалист по созданию карточек товара.
На основе данных товара подготовь текстовые данные карточки под выбранную платформу.
Платформа влияет на структуру, стиль, ограничения и итоговый JSON.
Не выдумывай свойства, которых нет во входных данных.
Если свойство неизвестно, формулируй нейтрально.
Не используй запрещённые обещания.
Не используй медицинские, юридические или гарантированные заявления.
Верни только валидный JSON без markdown.

Платформа: ${profile.displayName}
Режим: ${MODE_LABELS[input.mode]}
Подсказка режима: ${profile.modeHints[input.mode]}

Входные данные:
${formatInputFields(input)}

${platformBlock}

Верни строго такой JSON:
${JSON_SCHEMA}

Для platformSpecific заполни только активную платформу по схеме:
${specificSchema}

Все остальные поля в platformSpecific должны быть null.`;
}
