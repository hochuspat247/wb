import { detectCategory, extractProductName } from "@/lib/category";
import { sanitizeKeywords, sanitizeMarketplaceTextResult } from "@/lib/contentQuality";
import { getPlatformProfile } from "@/lib/marketplace/platformProfiles";
import { collectTextForModerationScan, scanForbiddenWords } from "@/lib/marketplace/utils";
import type {
  AvitoTextData,
  MarketplaceTextInput,
  MarketplaceTextResult,
  OzonTextData,
  WildberriesTextData,
  YandexMarketTextData
} from "@/types/marketplace";

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildCharacteristics(input: MarketplaceTextInput, productLabel: string) {
  const base = [
    { key: "Тип товара", value: productLabel },
    { key: "Категория", value: input.category }
  ];

  const optional: [string, string | undefined][] = [
    ["Бренд", input.brand],
    ["Артикул", input.sellerSku],
    ["Цвет", input.color],
    ["Размер", input.size],
    ["Материал", input.material],
    ["Габариты", input.dimensions],
    ["Вес", input.weight],
    ["Комплектация", input.packageContents]
  ];

  for (const [key, value] of optional) {
    if (value?.trim()) {
      base.push({ key, value: value.trim() });
    }
  }

  return base.slice(0, 10);
}

function buildAdvantages(input: MarketplaceTextInput, productLabel: string) {
  if (input.advantages?.length) {
    return input.advantages.slice(0, 5);
  }

  const items = [
    `${productLabel} для повседневного использования`,
    input.useCase ? `Подходит для: ${input.useCase}` : "Понятное назначение по описанию",
    input.targetAudience ? `Для ${input.targetAudience}` : "Удобно для ежедневных задач"
  ];

  if (input.packageContents) {
    items.push(`В комплекте: ${input.packageContents}`);
  }

  return items.slice(0, 5);
}

function buildKeywords(productName: string, category: string) {
  const name = productName.toLowerCase();
  const categoryKeyword = category === "Другое" ? "" : category.toLowerCase();
  return sanitizeKeywords(
    Array.from(
      new Set([
        name,
        categoryKeyword ? `${name} ${categoryKeyword}` : "",
        `${name} купить`,
        `${name} для дома`,
        `${name} в подарок`,
        categoryKeyword
      ])
    ),
    productName
  ).slice(0, 12);
}

function buildSafeImageTexts(input: MarketplaceTextInput, productLabel: string, mode: MarketplaceTextInput["mode"]) {
  const texts: string[] = [];

  if (input.color) texts.push(input.color);
  if (input.size) texts.push(`Размер ${input.size}`);
  if (input.material) texts.push(input.material);
  if (input.useCase) texts.push(input.useCase.slice(0, 30));

  if (texts.length < 3) {
    texts.push("Компактный", "Практичный", "Для дома");
  }

  if (mode === "promo_creative") {
    texts.push("Новинка", "Выгодно");
  }

  return texts.slice(0, 6).map((t) => sentenceCase(t));
}

function buildWildberries(input: MarketplaceTextInput, productLabel: string): WildberriesTextData {
  const profile = getPlatformProfile("wildberries");
  const wbName = productLabel.slice(0, 60);
  const characteristics = buildCharacteristics(input, productLabel);

  return {
    wbName,
    wbDescription: `${productLabel}. ${input.productDescription}. ${input.useCase ? `Подходит для сценария: ${input.useCase}.` : "Удобен для повседневного использования."}`,
    wbCharacteristics: characteristics,
    wbPhotoRules: [
      "Товар на нейтральном или белом фоне",
      "Без цены и CTA на главном фото",
      "Короткие подписи о свойствах товара"
    ],
    wbSafeImageTexts: buildSafeImageTexts(input, productLabel, input.mode),
    wbForbiddenImageTexts: profile.forbiddenSafeImageWords.map((w) => `Не писать: «${w}»`),
    wbQualityTips: [
      "Проверьте длину названия",
      "Сверьте характеристики с реальным товаром",
      "Добавьте фото с разных ракурсов"
    ]
  };
}

function buildOzon(input: MarketplaceTextInput, productLabel: string): OzonTextData {
  return {
    ozonName: `${productLabel}${input.brand ? `, ${input.brand}` : ""}`.slice(0, 120),
    ozonAnnotation: `${productLabel} — ${input.productDescription.slice(0, 120)}`,
    ozonDescription: `Подробное описание товара «${productLabel}». ${input.productDescription}. ${
      input.useCase ? `Сценарий: ${input.useCase}.` : ""
    } ${input.packageContents ? `Комплектация: ${input.packageContents}.` : ""}`,
    ozonRichContentBlocks: [
      {
        title: "Почему стоит купить",
        text: buildAdvantages(input, productLabel).join(". ") + "."
      },
      {
        title: "Сценарии использования",
        text: input.useCase || `Подходит для повседневного использования: ${input.productDescription.slice(0, 100)}`
      },
      {
        title: "Что в комплекте",
        text: input.packageContents || "Уточните комплектацию у продавца или в описании товара."
      }
    ],
    ozonCharacteristics: buildCharacteristics(input, productLabel),
    ozonMediaTips: [
      "Главное фото на белом фоне",
      "Инфографика с ключевыми характеристиками",
      "Фото товара в использовании",
      "Детали и комплектация отдельными кадрами"
    ]
  };
}

function buildAvito(input: MarketplaceTextInput, productLabel: string): AvitoTextData {
  const priceBlock = input.price
    ? `Цена: ${input.price}${input.oldPrice ? ` (было ${input.oldPrice})` : ""}${input.discount ? `, скидка ${input.discount}` : ""}`
    : "Цена по запросу — напишите в сообщения";

  return {
    avitoTitle: `${productLabel}${input.useCase ? ` — ${input.useCase}` : " для дома и поездок"}`.slice(0, 80),
    avitoDescription: `Продаю ${productLabel.toLowerCase()}. ${input.productDescription}. ${
      input.color ? `Цвет: ${input.color}.` : ""
    } ${input.packageContents ? `В комплекте: ${input.packageContents}.` : ""} Состояние уточняйте в переписке.`,
    avitoPriceBlock: priceBlock,
    avitoBenefits: buildAdvantages(input, productLabel),
    avitoCallToAction: "Напишите, отвечу на вопросы и помогу с выбором",
    avitoDeliveryText: "Самовывоз или доставка по договорённости. Уточняйте в сообщениях.",
    avitoQuestionsAnswers: [
      {
        question: "Товар в наличии?",
        answer: "Напишите — подтвержу наличие и сроки."
      },
      {
        question: "Можно посмотреть перед покупкой?",
        answer: "Да, договоримся о встрече или пришлю дополнительные фото."
      },
      {
        question: "Есть доставка?",
        answer: "Возможна доставка или самовывоз — обсудим в чате."
      }
    ]
  };
}

function buildYandexMarket(input: MarketplaceTextInput, productLabel: string): YandexMarketTextData {
  const profile = getPlatformProfile("yandex_market");
  const parts = [productLabel];
  if (input.brand) parts.push(input.brand);
  if (input.color) parts.push(input.color);
  if (input.size) parts.push(`размер ${input.size}`);

  return {
    yandexName: parts.join(", ").slice(0, 120),
    yandexDescription: `${productLabel}. ${input.productDescription}. ${input.useCase ? `Подходит для сценария: ${input.useCase}.` : "Подходит для повседневных задач и подарка."}`,
    yandexCharacteristics: buildCharacteristics(input, productLabel),
    yandexImageRules: [
      "Нейтральный фон",
      "Без цены и контактов на фото",
      "Короткие подписи о свойствах"
    ],
    yandexSafeImageTexts: buildSafeImageTexts(input, productLabel, input.mode),
    yandexForbiddenImageTexts: profile.forbiddenSafeImageWords.map((w) => `Не писать: «${w}»`),
    yandexQualityTips: [
      "Проверьте информативность названия",
      "Заполните все характеристики категории",
      "Добавьте качественные фото"
    ]
  };
}

function buildPlatformSpecific(input: MarketplaceTextInput, productLabel: string) {
  const empty = { wildberries: null, ozon: null, avito: null, yandexMarket: null };

  switch (input.platform) {
    case "wildberries":
      return { ...empty, wildberries: buildWildberries(input, productLabel) };
    case "ozon":
      return { ...empty, ozon: buildOzon(input, productLabel) };
    case "avito":
      return { ...empty, avito: buildAvito(input, productLabel) };
    case "yandex_market":
      return { ...empty, yandexMarket: buildYandexMarket(input, productLabel) };
  }
}

function resolveTitle(input: MarketplaceTextInput, productLabel: string, platformSpecific: MarketplaceTextResult["platformSpecific"]) {
  if (input.platform === "wildberries" && platformSpecific.wildberries) {
    return platformSpecific.wildberries.wbName;
  }
  if (input.platform === "ozon" && platformSpecific.ozon) {
    return platformSpecific.ozon.ozonName;
  }
  if (input.platform === "avito" && platformSpecific.avito) {
    return platformSpecific.avito.avitoTitle;
  }
  if (input.platform === "yandex_market" && platformSpecific.yandexMarket) {
    return platformSpecific.yandexMarket.yandexName;
  }
  return productLabel;
}

function resolveDescription(input: MarketplaceTextInput, platformSpecific: MarketplaceTextResult["platformSpecific"]) {
  if (input.platform === "wildberries" && platformSpecific.wildberries) {
    return platformSpecific.wildberries.wbDescription;
  }
  if (input.platform === "ozon" && platformSpecific.ozon) {
    return platformSpecific.ozon.ozonDescription;
  }
  if (input.platform === "avito" && platformSpecific.avito) {
    return platformSpecific.avito.avitoDescription;
  }
  if (input.platform === "yandex_market" && platformSpecific.yandexMarket) {
    return platformSpecific.yandexMarket.yandexDescription;
  }
  return input.productDescription;
}

export function generateMarketplaceTextFallback(input: MarketplaceTextInput): MarketplaceTextResult {
  const category = input.category || detectCategory(input.productDescription);
  const productName = extractProductName(input.productDescription);
  const productLabel = sentenceCase(productName);
  const profile = getPlatformProfile(input.platform);
  const platformSpecific = buildPlatformSpecific(input, productLabel);
  const advantages = buildAdvantages(input, productLabel);
  const characteristics = buildCharacteristics(input, productLabel);
  const keywords = buildKeywords(productName, category);
  const imageTexts = buildSafeImageTexts(input, productLabel, input.mode);
  const title = resolveTitle(input, productLabel, platformSpecific);
  const fullDescription = resolveDescription(input, platformSpecific);

  const moderationWarnings: string[] = [];
  if (input.mode === "promo_creative") {
    moderationWarnings.push("Промо-режим: проверьте правила площадки перед загрузкой");
  }

  const draft: MarketplaceTextResult = {
    platform: input.platform,
    mode: input.mode,
    title,
    shortTitle: title.slice(0, 60),
    seoTitle: `${title} — ${category}`.slice(0, 120),
    shortDescription: fullDescription.slice(0, 200),
    fullDescription,
    advantages,
    characteristics,
    keywords,
    imageTexts,
    infographicTexts: imageTexts,
    platformFields: {
      category,
      brand: input.brand,
      sellerSku: input.sellerSku,
      color: input.color,
      size: input.size,
      material: input.material,
      dimensions: input.dimensions,
      weight: input.weight,
      packageContents: input.packageContents
    },
    platformSpecific,
    moderationWarnings,
    improvementTips: [
      "Дополните характеристики реальными данными товара",
      "Проверьте фото перед публикацией",
      profile.modeHints[input.mode]
    ],
    exportChecklist: [...profile.exportChecklistBase]
  };

  if (input.mode === "marketplace_safe" && (input.platform === "wildberries" || input.platform === "yandex_market")) {
    const found = scanForbiddenWords(collectTextForModerationScan(draft));
    for (const word of found) {
      moderationWarnings.push(`Обнаружено потенциально запрещённое слово для safe-режима: «${word}»`);
    }
  }

  return sanitizeMarketplaceTextResult(draft, input);
}
