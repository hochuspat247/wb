import type { MarketplaceTextInput, MarketplaceTextResult } from "@/types/marketplace";
import type { ProductCardInput, ProductCardResult } from "@/types/product-card";

const SERVICE_TEXT_PATTERNS = [
  /\bнейтральное описание\b/gi,
  /\bбез рекламных обещаний\b/gi,
  /\bдля карточки\s+(Wildberries|WB|Ozon|Avito|Яндекс Маркета?)\b/gi,
  /\bтекст для маркетплейса\b/gi,
  /\bтовары? для маркетплейса\b/gi,
  /\bпольза сформулирована\b/gi,
  /\bописание построено на основе[^.?!]*[.?!]?/gi,
  /\bформулировки сделаны[^.?!]*[.?!]?/gi,
  /\bтакой текст удобно использовать[^.?!]*[.?!]?/gi,
  /\bготов(?:ая|ую|ой|ые)? карточк[а-я]*\b/gi,
  /\bкарточк[а-я]* с SEO и инфографик[а-я]*\b/gi
];

const SERVICE_KEYWORD_PATTERNS = [
  /^товар$/i,
  /^товары$/i,
  /^товар\s+/i,
  /маркетплейс/i,
  /wildberries/i,
  /^wb$/i,
  /ozon/i,
  /яндекс\s*маркет/i,
  /avito/i
];

const NON_PRODUCT_BENEFIT_PATTERNS = [
  /карточк/i,
  /генерац/i,
  /дизайн/i,
  /подач/i,
  /описани/i,
  /\bseo\b/i,
  /текст/i,
  /инфографик/i,
  /маркетплейс/i
];

const STRICT_SERVICE_TEXT_PATTERNS = [
  /marketplace_safe/i,
  /premium-marketplace/i,
  /\bprompt\b/i,
  /\bai[-\s]?generated\b/i,
  /\u043f\u0440\u043e\u043c\u043f\u0442/i,
  /\u0433\u0435\u043d\u0435\u0440\u0430\u0446/i,
  /\u043d\u0435\u0439\u0440\u043e\u0441\u0435\u0442/i,
  /\u0442\u0435\u043a\u0441\u0442\s+\u0434\u043b\u044f\s+\u0438\u043d\u0444\u043e\u0433\u0440\u0430\u0444\u0438\u043a/i,
  /\u0434\u043b\u044f\s+\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438\s+(wildberries|ozon|avito|wb)/i,
  /\u0434\u043b\u044f\s+\u043c\u0430\u0440\u043a\u0435\u0442\u043f\u043b\u0435\u0439\u0441/i,
  /\u0431\u0435\u0437\s+\u0440\u0435\u043a\u043b\u0430\u043c\u043d\u044b\u0445\s+\u043e\u0431\u0435\u0449\u0430\u043d/i,
  /\u043d\u0435\u0439\u0442\u0440\u0430\u043b\u044c\u043d\u043e\u0435\s+\u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435/i,
  /\u043f\u043e\u0434\u0430\u0447\u0430\s+\u0432\s+\u043f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d/i
];

export function sanitizeGeneratedText(value: string) {
  let next = value;

  for (const pattern of SERVICE_TEXT_PATTERNS) {
    next = next.replace(pattern, "");
  }

  next = next
    .replace(/продающ[а-яё]*\s+обложк[а-яё]*/gi, "")
    .replace(/обложк[а-яё]*\s+для\s+(Wildberries|WB|Ozon|Avito|Яндекс[а-яё\s]*)/gi, "")
    .replace(/для\s+(Wildberries|WB|Ozon|Avito)\b/gi, "")
    .replace(/понятн[а-яё]*\s+перв[а-яё]*\s+экран[а-яё]*/gi, "")
    .replace(/акцент\s+на\s+главн[а-яё]*/gi, "")
    .replace(/хит\s+для\s+каталог[а-яё]*/gi, "");

  return next
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeKeywords(keywords: string[], productName = "") {
  const normalizedProductName = productName.toLowerCase();

  return Array.from(
    new Set(
      keywords
        .map((keyword) => sanitizeGeneratedText(keyword).trim())
        .filter(Boolean)
        .filter((keyword) => {
          const lower = keyword.toLowerCase();
          if (SERVICE_KEYWORD_PATTERNS.some((pattern) => pattern.test(keyword))) return false;
          if (lower === normalizedProductName) return true;
          return !/^для\s+(маркетплейса|карточки|витрины)$/i.test(keyword);
        })
    )
  );
}

export function sanitizeBenefits(benefits: string[] | null | undefined) {
  if (!Array.isArray(benefits)) {
    return [];
  }

  return benefits
    .map((benefit) => sanitizeGeneratedText(benefit))
    .filter(Boolean)
    .filter((benefit) => !NON_PRODUCT_BENEFIT_PATTERNS.some((pattern) => pattern.test(benefit)));
}

export function sanitizeProductCardResult(card: ProductCardResult, input?: ProductCardInput): ProductCardResult {
  const productName = card.title || input?.productDescription || "";
  const sourceBenefits = Array.isArray(card.benefits) ? card.benefits : [];
  const sourceKeywords = Array.isArray(card.keywords) ? card.keywords : [];
  const sourceInfographic = Array.isArray(card.infographicTexts) ? card.infographicTexts : [];
  const sourceTips = Array.isArray(card.marketplaceTips) ? card.marketplaceTips : [];
  const sourceCharacteristics = Array.isArray(card.characteristics) ? card.characteristics : [];
  const benefits = sanitizeBenefits(sourceBenefits);

  return {
    ...card,
    title: sanitizeGeneratedText(card.title),
    shortDescription: sanitizeGeneratedText(card.shortDescription),
    fullDescription: sanitizeGeneratedText(card.fullDescription),
    benefits: benefits.length ? benefits : sourceBenefits.map(sanitizeGeneratedText).filter(Boolean),
    characteristics: sourceCharacteristics,
    keywords: sanitizeKeywords(sourceKeywords, productName).slice(0, sourceKeywords.length || 15),
    infographicTexts: sourceInfographic.map(sanitizeGeneratedText).filter(Boolean),
    marketplaceTips: sourceTips.map(sanitizeGeneratedText).filter(Boolean),
    visualConcept: sanitizeGeneratedText(card.visualConcept)
  };
}

export function validateGeneratedCardText(text: string): { isValid: boolean; problems: string[] } {
  const problems: string[] = [];
  const value = text.trim();

  for (const pattern of STRICT_SERVICE_TEXT_PATTERNS) {
    if (pattern.test(value)) {
      problems.push(`Service or prompt-like phrase matched: ${pattern.source}`);
    }
  }

  return {
    isValid: problems.length === 0,
    problems
  };
}

export function validateProductCardResultText(card: ProductCardResult): { isValid: boolean; problems: string[] } {
  const parts = [
    card.title,
    card.shortDescription,
    card.fullDescription,
    card.visualConcept,
    ...(Array.isArray(card.benefits) ? card.benefits : []),
    ...(Array.isArray(card.infographicTexts) ? card.infographicTexts : []),
    ...(Array.isArray(card.marketplaceTips) ? card.marketplaceTips : []),
    ...(Array.isArray(card.keywords) ? card.keywords : []),
    ...(Array.isArray(card.characteristics)
      ? card.characteristics.flatMap((item) => [item?.key, item?.value])
      : [])
  ];

  return validateGeneratedCardText(parts.filter(Boolean).join("\n"));
}

export function sanitizeMarketplaceTextResult(
  result: MarketplaceTextResult,
  input?: MarketplaceTextInput
): MarketplaceTextResult {
  const canonicalName = input?.identifiedProductName?.trim() || "";
  const productName = canonicalName || result.title || input?.productDescription || "";
  const advantages = sanitizeBenefits(result.advantages);
  const boundTitle = bindProductTitle(result.title, canonicalName);
  const boundShortTitle = bindProductTitle(result.shortTitle || result.title, canonicalName);
  const repairedFullDescription = repairProductDescription(
    result.fullDescription,
    canonicalName || productName,
    input?.productDescription
  );
  const repairedShortDescription = repairProductDescription(
    result.shortDescription,
    canonicalName || productName,
    input?.productDescription,
    220
  );
  const characteristics = enrichCharacteristics(
    result.characteristics,
    input,
    canonicalName || productName
  );

  const wb = result.platformSpecific.wildberries
    ? {
        ...result.platformSpecific.wildberries,
        wbName: sanitizeGeneratedText(
          bindProductTitle(result.platformSpecific.wildberries.wbName, canonicalName)
        ),
        wbDescription: repairProductDescription(
          result.platformSpecific.wildberries.wbDescription,
          canonicalName || productName,
          input?.productDescription,
          1600
        ),
        wbCharacteristics: enrichCharacteristics(
          result.platformSpecific.wildberries.wbCharacteristics,
          input,
          canonicalName || productName
        ),
        wbSafeImageTexts: result.platformSpecific.wildberries.wbSafeImageTexts
          .map(sanitizeGeneratedText)
          .filter(Boolean)
          .map(fixInfographicTypo)
          .filter((text) => !looksLikeGibberish(text) && !isOffTopicForProduct(text, canonicalName || productName))
      }
    : null;

  return {
    ...result,
    title: sanitizeGeneratedText(boundTitle),
    shortTitle: sanitizeGeneratedText(boundShortTitle),
    seoTitle: sanitizeGeneratedText(bindProductTitle(result.seoTitle || result.title, canonicalName)),
    shortDescription: sanitizeGeneratedText(repairedShortDescription),
    fullDescription: sanitizeGeneratedText(repairedFullDescription),
    advantages: advantages.length ? advantages : result.advantages.map(sanitizeGeneratedText).filter(Boolean),
    characteristics,
    keywords: sanitizeKeywords(result.keywords, productName).slice(0, result.keywords.length || 15),
    imageTexts: result.imageTexts.map(sanitizeGeneratedText).filter(Boolean).map(fixInfographicTypo),
    infographicTexts: result.infographicTexts
      .map(sanitizeGeneratedText)
      .filter(Boolean)
      .map(fixInfographicTypo)
      .filter((text) => !looksLikeGibberish(text)),
    platformSpecific: {
      wildberries: wb,
      ozon: result.platformSpecific.ozon
        ? {
            ...result.platformSpecific.ozon,
            ozonName: sanitizeGeneratedText(
              bindProductTitle(result.platformSpecific.ozon.ozonName, canonicalName)
            ),
            ozonAnnotation: sanitizeGeneratedText(
              repairProductDescription(
                result.platformSpecific.ozon.ozonAnnotation,
                canonicalName || productName,
                input?.productDescription,
                400
              )
            ),
            ozonDescription: sanitizeGeneratedText(
              repairProductDescription(
                result.platformSpecific.ozon.ozonDescription,
                canonicalName || productName,
                input?.productDescription,
                1600
              )
            ),
            ozonCharacteristics: enrichCharacteristics(
              result.platformSpecific.ozon.ozonCharacteristics,
              input,
              canonicalName || productName
            ),
            ozonRichContentBlocks: result.platformSpecific.ozon.ozonRichContentBlocks.map((block) => ({
              ...block,
              title: sanitizeGeneratedText(block.title),
              text: sanitizeGeneratedText(block.text)
            }))
          }
        : null,
      avito: result.platformSpecific.avito
        ? {
            ...result.platformSpecific.avito,
            avitoTitle: sanitizeGeneratedText(
              bindProductTitle(result.platformSpecific.avito.avitoTitle, canonicalName)
            ),
            avitoDescription: sanitizeGeneratedText(
              repairProductDescription(
                result.platformSpecific.avito.avitoDescription,
                canonicalName || productName,
                input?.productDescription,
                1600
              )
            ),
            avitoBenefits: sanitizeBenefits(result.platformSpecific.avito.avitoBenefits)
          }
        : null,
      yandexMarket: result.platformSpecific.yandexMarket
        ? {
            ...result.platformSpecific.yandexMarket,
            yandexName: sanitizeGeneratedText(
              bindProductTitle(result.platformSpecific.yandexMarket.yandexName, canonicalName)
            ),
            yandexDescription: sanitizeGeneratedText(
              repairProductDescription(
                result.platformSpecific.yandexMarket.yandexDescription,
                canonicalName || productName,
                input?.productDescription,
                1600
              )
            ),
            yandexCharacteristics: enrichCharacteristics(
              result.platformSpecific.yandexMarket.yandexCharacteristics,
              input,
              canonicalName || productName
            ),
            yandexSafeImageTexts: result.platformSpecific.yandexMarket.yandexSafeImageTexts
              .map(sanitizeGeneratedText)
              .filter(Boolean)
              .map(fixInfographicTypo)
              .filter((text) => !looksLikeGibberish(text))
          }
        : null
    }
  };
}

function isBalloonLikeProduct(productName: string) {
  return /шар|balloon|надувн|фольг/i.test(productName);
}

function isOffTopicForProduct(text: string, productName: string) {
  if (!text.trim()) return true;
  if (isBalloonLikeProduct(productName)) {
    return /трениров|фитнес|мяч(?!ик)|теннис|спортзал|воркаут|гандбол|футбол/i.test(text);
  }
  return false;
}

/** Replace off-topic or too-short marketplace copy with a product-faithful description. */
export function repairProductDescription(
  current: string,
  productName: string,
  sourceFacts?: string,
  maxLength = 1200
) {
  const cleanName = sanitizeGeneratedText(productName || "Товар");
  const facts = sanitizeGeneratedText(sourceFacts || "");
  const cleanCurrent = sanitizeGeneratedText(current || "");

  const offTopic = isOffTopicForProduct(cleanCurrent, cleanName);
  const tooShort = cleanCurrent.length < 180;

  if (!offTopic && !tooShort) {
    return cleanCurrent.slice(0, maxLength);
  }

  const parts = [
    `${cleanName} — товар для оформления праздника, декора и фотозоны.`,
    facts && facts.toLowerCase() !== cleanName.toLowerCase() ? facts : "",
    isBalloonLikeProduct(cleanName)
      ? "Подходит для дня рождения, фотосессии, украшения комнаты или мероприятия. Перед использованием ознакомьтесь с рекомендациями по надуванию и креплению."
      : "Описание составлено по данным продавца. Уточняйте цвет, размер и комплектацию в характеристиках карточки.",
    "Перед заказом проверьте название, фото и параметры — они должны совпадать с получаемым товаром."
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function enrichCharacteristics(
  current: { key: string; value: string }[] | undefined,
  input: MarketplaceTextInput | undefined,
  productName: string
) {
  const map = new Map<string, string>();

  for (const item of current || []) {
    const key = sanitizeGeneratedText(item?.key || "");
    const value = sanitizeGeneratedText(item?.value || "");
    if (key && value && !isOffTopicForProduct(`${key} ${value}`, productName)) {
      map.set(key.toLowerCase(), value);
    }
  }

  const extras: Array<[string, string | undefined]> = [
    ["Тип товара", productName],
    ["Категория", input?.category],
    ["Бренд", input?.brand],
    ["Цвет", input?.color],
    ["Размер", input?.size],
    ["Материал", input?.material],
    ["Габариты", input?.dimensions],
    ["Вес", input?.weight],
    ["Комплектация", input?.packageContents],
    ["Назначение", input?.useCase || (isBalloonLikeProduct(productName) ? "Праздничный декор" : undefined)],
    ["Для кого", input?.targetAudience]
  ];

  for (const [key, value] of extras) {
    if (!value?.trim()) continue;
    if (!map.has(key.toLowerCase())) {
      map.set(key.toLowerCase(), sanitizeGeneratedText(value));
    }
  }

  if (isBalloonLikeProduct(productName) && !map.has("форма")) {
    if (/восклицат/i.test(`${productName} ${input?.productDescription || ""}`)) {
      map.set("форма", "Восклицательный знак");
    }
  }

  return Array.from(map.entries())
    .map(([key, value]) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }))
    .slice(0, 12);
}

const TITLE_STOPWORDS = new Set([
  "для",
  "и",
  "на",
  "с",
  "из",
  "по",
  "в",
  "the",
  "a",
  "of",
  "набор",
  "комплект",
  "товар"
]);

function tokenizeProductName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !TITLE_STOPWORDS.has(token));
}

/** Force marketplace titles onto the confirmed product when the model drifts to another SKU. */
export function bindProductTitle(current: string, canonicalName: string) {
  const cleanCurrent = sanitizeGeneratedText(current || "").slice(0, 120);
  const canonical = sanitizeGeneratedText(canonicalName || "").slice(0, 120);

  if (!canonical) {
    return cleanCurrent;
  }

  if (!cleanCurrent) {
    return canonical;
  }

  const canonicalTokens = tokenizeProductName(canonical);
  const currentTokens = tokenizeProductName(cleanCurrent);

  if (!canonicalTokens.length) {
    return cleanCurrent;
  }

  const overlap = canonicalTokens.filter((token) =>
    currentTokens.some((current) => current.includes(token) || token.includes(current))
  ).length;
  const overlapRatio = overlap / canonicalTokens.length;

  if (overlapRatio < 0.4) {
    return canonical;
  }

  const lowerCurrent = cleanCurrent.toLowerCase();
  const lowerCanonical = canonical.toLowerCase();

  if (!lowerCurrent.includes(lowerCanonical) && !lowerCanonical.includes(lowerCurrent.slice(0, 24))) {
    return canonical;
  }

  return cleanCurrent.slice(0, 80);
}

const INFOGRAPHIC_TYPO_MAP: Array<[RegExp, string]> = [
  [/\bКАЧТЕВО\b/gi, "КАЧЕСТВО"],
  [/\bкачтево\b/gi, "качество"],
  [/\bПРЕИМУЩЕТВА\b/gi, "ПРЕИМУЩЕСТВА"],
  [/\bХАРАКТЕРИТИКИ\b/gi, "ХАРАКТЕРИСТИКИ"]
];

export function fixInfographicTypo(value: string) {
  let next = value;
  for (const [pattern, replacement] of INFOGRAPHIC_TYPO_MAP) {
    next = next.replace(pattern, replacement);
  }
  return next;
}

/** Detect OCR/LLM gibberish like «Прямег» / «Понтршиодный». */
export function looksLikeGibberish(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((word) => word.length >= 5);

  if (!words.length) {
    return false;
  }

  let suspicious = 0;
  for (const word of words) {
    const vowels = (word.match(/[аеёиоуыэюяaeiouy]/gi) || []).length;
    const letters = (word.match(/\p{L}/gu) || []).length;
    if (letters >= 6 && vowels / letters < 0.18) {
      suspicious += 1;
    }
    if (/(.)\1{3,}/i.test(word)) {
      suspicious += 1;
    }
  }

  return suspicious >= Math.max(1, Math.ceil(words.length * 0.5));
}
