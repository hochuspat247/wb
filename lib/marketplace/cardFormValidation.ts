import { marketplaceLabelToPlatform, platformToMarketplaceLabel } from "@/lib/marketplace/utils";
import type { MarketplacePlatform, MarketplaceTextMode } from "@/types/marketplace";
import type {
  CardSeriesCount,
  ImageDesignPreset,
  ImageGenerationMode,
  ImageProviderMode,
  ProductCardInput
} from "@/types/product-card";

export const CARD_MARKETPLACES = ["Wildberries", "Ozon", "Avito", "Яндекс Маркет"] as const;
export type CardMarketplaceLabel = (typeof CARD_MARKETPLACES)[number];

export const CARD_STYLES = ["Минималистичный", "Премиальный", "Яркий", "Нежный", "Технологичный"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export const CARD_TEXT_MODES: Array<{ label: string; value: MarketplaceTextMode }> = [
  { label: "Безопасно для модерации", value: "marketplace_safe" },
  { label: "Промо-креатив", value: "promo_creative" },
  { label: "СЕО-описание", value: "seo" },
  { label: "Полная карточка", value: "full_listing" }
];

export const CARD_DESIGN_PRESETS: Array<{ label: string; value: ImageDesignPreset }> = [
  { label: "Маркетплейс · яркие плашки", value: "premium-marketplace" },
  { label: "Каталог · спокойный премиум", value: "luxury-catalog" },
  { label: "Простой · меньше текста", value: "standard" }
];

export const CARD_SERIES_COUNTS: CardSeriesCount[] = [1, 3, 5, 7, 10];

export const NANO_BANANA_IMAGE_MODEL = "nb2" as const;
export const NANO_BANANA_ASPECT_RATIO = "4:5" as const;
export const NANO_BANANA_RESOLUTION = "1k" as const;
export const NANO_BANANA_OUTPUT_FORMAT = "png" as const;

const MARKETPLACE_ALIASES: Record<string, CardMarketplaceLabel> = {
  wildberries: "Wildberries",
  ozon: "Ozon",
  avito: "Avito",
  yandex_market: "Яндекс Маркет",
  "яндекс маркет": "Яндекс Маркет"
};

const TEXT_MODE_SET = new Set<MarketplaceTextMode>(CARD_TEXT_MODES.map((item) => item.value));
const STYLE_SET = new Set<string>(CARD_STYLES);
const DESIGN_PRESET_SET = new Set<ImageDesignPreset>(CARD_DESIGN_PRESETS.map((item) => item.value));
const IMAGE_MODE_SET = new Set<ImageGenerationMode>(["fast", "legacy", "pro"]);
const IMAGE_PROVIDER_SET = new Set<ImageProviderMode>(["auto", "nanobanana_expert", "gemini"]);
const SERIES_COUNT_SET = new Set<number>(CARD_SERIES_COUNTS);

export function normalizeMarketplaceLabel(value?: string): CardMarketplaceLabel {
  const clean = value?.trim();

  if (!clean) {
    return "Wildberries";
  }

  if ((CARD_MARKETPLACES as readonly string[]).includes(clean)) {
    return clean as CardMarketplaceLabel;
  }

  const alias = MARKETPLACE_ALIASES[clean.toLowerCase()];
  if (alias) {
    return alias;
  }

  try {
    const platform = marketplaceLabelToPlatform(clean);
    const label = platformToMarketplaceLabel(platform);
    if ((CARD_MARKETPLACES as readonly string[]).includes(label)) {
      return label as CardMarketplaceLabel;
    }
  } catch {
    // ignore invalid platform values
  }

  return "Wildberries";
}

export function normalizeMarketplacePlatform(value?: string): MarketplacePlatform {
  return marketplaceLabelToPlatform(normalizeMarketplaceLabel(value));
}

export function normalizeCardStyle(value?: string): CardStyle {
  const clean = value?.trim();

  if (clean && STYLE_SET.has(clean)) {
    return clean as CardStyle;
  }

  return "Премиальный";
}

export function normalizeTextMode(value?: string): MarketplaceTextMode {
  const clean = value?.trim() as MarketplaceTextMode | undefined;

  if (clean && TEXT_MODE_SET.has(clean)) {
    return clean;
  }

  return "marketplace_safe";
}

export function normalizeDesignPreset(value?: string): ImageDesignPreset {
  const clean = value?.trim() as ImageDesignPreset | undefined;

  if (clean && DESIGN_PRESET_SET.has(clean)) {
    return clean;
  }

  return "premium-marketplace";
}

export function normalizeImageMode(value?: string): ImageGenerationMode {
  const clean = value?.trim() as ImageGenerationMode | undefined;

  if (clean && IMAGE_MODE_SET.has(clean)) {
    return clean;
  }

  return "pro";
}

export function normalizeImageProvider(value?: string): ImageProviderMode {
  const clean = value?.trim() as ImageProviderMode | undefined;

  if (clean && IMAGE_PROVIDER_SET.has(clean)) {
    return clean;
  }

  return "auto";
}

export function normalizeCardsCount(value?: number | string): CardSeriesCount {
  const numeric = typeof value === "string" ? Number(value) : value;

  if (numeric && SERIES_COUNT_SET.has(numeric)) {
    return numeric as CardSeriesCount;
  }

  return 1;
}

export function normalizeOptionalText(value?: string, maxLength = 240) {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) {
    return undefined;
  }

  return clean.slice(0, maxLength);
}

export function normalizeProductCardInput(input: ProductCardInput): ProductCardInput {
  const marketplace = normalizeMarketplaceLabel(input.marketplace);

  return {
    ...input,
    productDescription: input.productDescription?.replace(/\s+/g, " ").trim() ?? "",
    category: normalizeOptionalText(input.category, 120),
    marketplace,
    style: normalizeCardStyle(input.style),
    platform: input.platform ?? normalizeMarketplacePlatform(marketplace),
    textMode: normalizeTextMode(input.textMode),
    brand: normalizeOptionalText(input.brand, 80),
    sellerSku: normalizeOptionalText(input.sellerSku, 80),
    color: normalizeOptionalText(input.color, 80),
    size: normalizeOptionalText(input.size, 80),
    material: normalizeOptionalText(input.material, 120),
    dimensions: normalizeOptionalText(input.dimensions, 80),
    weight: normalizeOptionalText(input.weight, 80),
    packageContents: normalizeOptionalText(input.packageContents, 160),
    targetAudience: normalizeOptionalText(input.targetAudience, 120),
    useCase: normalizeOptionalText(input.useCase, 120),
    price: normalizeOptionalText(input.price, 40),
    oldPrice: normalizeOptionalText(input.oldPrice, 40),
    discount: normalizeOptionalText(input.discount, 40),
    sellerWishes: normalizeOptionalText(input.sellerWishes, 500),
    editInstructions: normalizeOptionalText(input.editInstructions, 800)
  };
}

export function validateProductCardInput(input: ProductCardInput): string | null {
  if (!input.productDescription?.trim()) {
    return "Добавьте описание товара, чтобы сгенерировать карточку.";
  }

  if (input.productDescription.trim().length < 2) {
    return "Опишите товар хотя бы в двух символах.";
  }

  return null;
}

export function resolveNanoBananaImageProvider(requested?: ImageProviderMode): ImageProviderMode {
  const normalized = normalizeImageProvider(requested);

  if (normalized === "gemini") {
    return "nanobanana_expert";
  }

  if (normalized === "auto") {
    return "nanobanana_expert";
  }

  return normalized;
}
