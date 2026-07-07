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
