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

export function sanitizeBenefits(benefits: string[]) {
  return benefits
    .map((benefit) => sanitizeGeneratedText(benefit))
    .filter(Boolean)
    .filter((benefit) => !NON_PRODUCT_BENEFIT_PATTERNS.some((pattern) => pattern.test(benefit)));
}

export function sanitizeProductCardResult(card: ProductCardResult, input?: ProductCardInput): ProductCardResult {
  const productName = card.title || input?.productDescription || "";
  const benefits = sanitizeBenefits(card.benefits);

  return {
    ...card,
    title: sanitizeGeneratedText(card.title),
    shortDescription: sanitizeGeneratedText(card.shortDescription),
    fullDescription: sanitizeGeneratedText(card.fullDescription),
    benefits: benefits.length ? benefits : card.benefits.map(sanitizeGeneratedText).filter(Boolean),
    keywords: sanitizeKeywords(card.keywords, productName).slice(0, card.keywords.length || 15),
    infographicTexts: card.infographicTexts.map(sanitizeGeneratedText).filter(Boolean),
    marketplaceTips: card.marketplaceTips.map(sanitizeGeneratedText).filter(Boolean),
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
    ...card.benefits,
    ...card.infographicTexts,
    ...card.marketplaceTips,
    ...card.keywords,
    ...card.characteristics.flatMap((item) => [item.key, item.value])
  ];

  return validateGeneratedCardText(parts.filter(Boolean).join("\n"));
}

export function sanitizeMarketplaceTextResult(
  result: MarketplaceTextResult,
  input?: MarketplaceTextInput
): MarketplaceTextResult {
  const productName = result.title || input?.productDescription || "";
  const advantages = sanitizeBenefits(result.advantages);

  return {
    ...result,
    title: sanitizeGeneratedText(result.title),
    shortTitle: sanitizeGeneratedText(result.shortTitle),
    seoTitle: sanitizeGeneratedText(result.seoTitle),
    shortDescription: sanitizeGeneratedText(result.shortDescription),
    fullDescription: sanitizeGeneratedText(result.fullDescription),
    advantages: advantages.length ? advantages : result.advantages.map(sanitizeGeneratedText).filter(Boolean),
    keywords: sanitizeKeywords(result.keywords, productName).slice(0, result.keywords.length || 15),
    imageTexts: result.imageTexts.map(sanitizeGeneratedText).filter(Boolean),
    infographicTexts: result.infographicTexts.map(sanitizeGeneratedText).filter(Boolean),
    platformSpecific: {
      wildberries: result.platformSpecific.wildberries
        ? {
            ...result.platformSpecific.wildberries,
            wbName: sanitizeGeneratedText(result.platformSpecific.wildberries.wbName),
            wbDescription: sanitizeGeneratedText(result.platformSpecific.wildberries.wbDescription),
            wbSafeImageTexts: result.platformSpecific.wildberries.wbSafeImageTexts
              .map(sanitizeGeneratedText)
              .filter(Boolean)
          }
        : null,
      ozon: result.platformSpecific.ozon
        ? {
            ...result.platformSpecific.ozon,
            ozonName: sanitizeGeneratedText(result.platformSpecific.ozon.ozonName),
            ozonAnnotation: sanitizeGeneratedText(result.platformSpecific.ozon.ozonAnnotation),
            ozonDescription: sanitizeGeneratedText(result.platformSpecific.ozon.ozonDescription),
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
            avitoTitle: sanitizeGeneratedText(result.platformSpecific.avito.avitoTitle),
            avitoDescription: sanitizeGeneratedText(result.platformSpecific.avito.avitoDescription),
            avitoBenefits: sanitizeBenefits(result.platformSpecific.avito.avitoBenefits)
          }
        : null,
      yandexMarket: result.platformSpecific.yandexMarket
        ? {
            ...result.platformSpecific.yandexMarket,
            yandexName: sanitizeGeneratedText(result.platformSpecific.yandexMarket.yandexName),
            yandexDescription: sanitizeGeneratedText(result.platformSpecific.yandexMarket.yandexDescription),
            yandexSafeImageTexts: result.platformSpecific.yandexMarket.yandexSafeImageTexts
              .map(sanitizeGeneratedText)
              .filter(Boolean)
          }
        : null
    }
  };
}
