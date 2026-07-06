import type { MarketplacePlatform, MarketplaceTextMode } from "@/types/marketplace";

const MARKETPLACE_LABEL_TO_PLATFORM: Record<string, MarketplacePlatform> = {
  Wildberries: "wildberries",
  Ozon: "ozon",
  Avito: "avito",
  "Яндекс Маркет": "yandex_market"
};

const PLATFORM_TO_LABEL: Record<MarketplacePlatform, string> = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  avito: "Avito",
  yandex_market: "Яндекс Маркет"
};

const TEXT_MODE_LABELS: Record<MarketplaceTextMode, string> = {
  marketplace_safe: "Безопасно для модерации",
  promo_creative: "Промо-креатив",
  seo: "SEO-описание",
  full_listing: "Полная карточка"
};

export function marketplaceLabelToPlatform(label: string): MarketplacePlatform {
  return MARKETPLACE_LABEL_TO_PLATFORM[label] ?? "wildberries";
}

export function platformToMarketplaceLabel(platform: MarketplacePlatform): string {
  return PLATFORM_TO_LABEL[platform];
}

export function textModeLabel(mode: MarketplaceTextMode): string {
  return TEXT_MODE_LABELS[mode];
}

export const FORBIDDEN_SAFE_WORDS = [
  "скидка",
  "хит",
  "лучший",
  "топ",
  "цена",
  "купить",
  "заказать",
  "акция",
  "распродажа"
] as const;

export function scanForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_SAFE_WORDS.filter((word) => lower.includes(word));
}

export function collectTextForModerationScan(result: {
  title: string;
  shortTitle: string;
  seoTitle: string;
  shortDescription: string;
  fullDescription: string;
  advantages: string[];
  imageTexts: string[];
  infographicTexts: string[];
  platformSpecific: {
    wildberries?: { wbName?: string; wbDescription?: string; wbSafeImageTexts?: string[] } | null;
    yandexMarket?: { yandexName?: string; yandexDescription?: string; yandexSafeImageTexts?: string[] } | null;
  };
}): string {
  const parts = [
    result.title,
    result.shortTitle,
    result.seoTitle,
    result.shortDescription,
    result.fullDescription,
    ...result.advantages,
    ...result.imageTexts,
    ...result.infographicTexts
  ];

  const wb = result.platformSpecific.wildberries;
  if (wb) {
    parts.push(wb.wbName ?? "", wb.wbDescription ?? "", ...(wb.wbSafeImageTexts ?? []));
  }

  const ym = result.platformSpecific.yandexMarket;
  if (ym) {
    parts.push(ym.yandexName ?? "", ym.yandexDescription ?? "", ...(ym.yandexSafeImageTexts ?? []));
  }

  return parts.join(" ");
}
