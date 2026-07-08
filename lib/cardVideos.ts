import type { GeneratedVideoSnapshot, ProductCardResult } from "@/types/product-card";

export function getCardGeneratedVideos(card: ProductCardResult): GeneratedVideoSnapshot[] {
  if (card.generatedVideos?.length) {
    return [...card.generatedVideos].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  if (card.generatedVideoUrl) {
    return [
      {
        orderId: card.generatedVideoTaskId || "legacy",
        url: card.generatedVideoUrl,
        provider: card.generatedVideoProvider,
        model: card.generatedVideoModel,
        createdAt: card.generatedAt
      }
    ];
  }

  return [];
}

export function hasCardGeneratedVideo(card: ProductCardResult) {
  return getCardGeneratedVideos(card).length > 0;
}

export function getLatestCardGeneratedVideo(card: ProductCardResult) {
  return getCardGeneratedVideos(card)[0] ?? null;
}
