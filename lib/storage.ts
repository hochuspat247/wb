import type { ProductCardResult } from "@/types/product-card";

const HISTORY_KEY = "marketcard-ai-history";
const HISTORY_LIMIT = 10;

function normalizeCard(card: Partial<ProductCardResult> & { id?: string }): ProductCardResult | null {
  if (!card?.id || !card.title) {
    return null;
  }

  return {
    id: card.id,
    title: card.title,
    shortDescription: card.shortDescription || "",
    fullDescription: card.fullDescription || card.shortDescription || "",
    benefits: Array.isArray(card.benefits) ? card.benefits : [],
    characteristics: Array.isArray(card.characteristics) ? card.characteristics : [],
    keywords: Array.isArray(card.keywords) ? card.keywords : [],
    infographicTexts: Array.isArray(card.infographicTexts) ? card.infographicTexts : [],
    marketplaceTips: Array.isArray(card.marketplaceTips) ? card.marketplaceTips : [],
    visualConcept: card.visualConcept || "",
    category: card.category || "",
    marketplace: card.marketplace || "Wildberries",
    style: card.style || "Премиальный",
    generatedAt: card.generatedAt || new Date().toISOString(),
    provider: card.provider || "Smart fallback",
    isFallback: Boolean(card.isFallback),
    imageDataUrl: card.imageDataUrl,
    generatedImageDataUrl: card.generatedImageDataUrl,
    generatedImageUrl: card.generatedImageUrl,
    generatedImageProvider: card.generatedImageProvider,
    generatedImageBase64: card.generatedImageBase64,
    generatedImageMimeType: card.generatedImageMimeType,
    generatedImageModel: card.generatedImageModel,
    generatedImagePrompt: card.generatedImagePrompt,
    generatedImageIsFallback: card.generatedImageIsFallback,
    generatedImageError: card.generatedImageError,
    generatedVideoUrl: card.generatedVideoUrl,
    generatedVideoTaskId: card.generatedVideoTaskId,
    generatedVideoProvider: card.generatedVideoProvider,
    generatedVideoModel: card.generatedVideoModel,
    generatedVideoStatus: card.generatedVideoStatus,
    generatedVideos: card.generatedVideos,
    bananasSpent: card.bananasSpent,
    usedCoupon: card.usedCoupon,
    generationId: card.generationId,
    seed: card.seed,
    price: card.price,
    ctaText: card.ctaText,
    headline: card.headline,
    designPreset: card.designPreset
  };
}

export function getHistory(): ProductCardResult[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as Array<Partial<ProductCardResult>>;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeCard).filter((item): item is ProductCardResult => item !== null);
  } catch {
    return [];
  }
}

export function saveToHistory(card: ProductCardResult) {
  if (typeof window === "undefined") {
    return [];
  }

  const normalized = normalizeCard(card);
  if (!normalized) {
    return getHistory();
  }

  const next = [normalized, ...getHistory().filter((item) => item.id !== normalized.id)].slice(0, HISTORY_LIMIT);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function removeFromHistory(id: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = getHistory().filter((item) => item.id !== id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearHistory() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(HISTORY_KEY);
}
