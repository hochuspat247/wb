import type { ProductCardResult } from "@/types/product-card";

export type DownloadPolicy = {
  cleanDownloadGenerationId: string | null;
  downloadsFullyUnlocked: boolean;
};

export function canDownloadCardImage(
  card: ProductCardResult,
  policy: DownloadPolicy | null,
  persistToServer: boolean
) {
  if (!persistToServer) {
    return true;
  }

  if (policy?.downloadsFullyUnlocked) {
    return true;
  }

  if (card.downloadUnlocked) {
    return true;
  }

  if (policy?.cleanDownloadGenerationId && card.id === policy.cleanDownloadGenerationId) {
    return true;
  }

  return false;
}

function stripWatermarkedCard(card: ProductCardResult): ProductCardResult {
  return {
    ...card,
    generatedImageBase64: null,
    generatedImageDataUrl: undefined,
    generatedImageUrl: null,
    downloadUnlocked: false,
    watermarkLocked: true,
    previewImageUrl: card.previewImageUrl ?? `/api/cards/${card.id}/image?variant=preview`
  };
}

export function applyDownloadPolicyToCard(
  card: ProductCardResult,
  policy: DownloadPolicy | null,
  persistToServer: boolean
): ProductCardResult {
  if (!persistToServer) {
    return card;
  }

  if (policy?.downloadsFullyUnlocked) {
    return {
      ...card,
      downloadUnlocked: true,
      watermarkLocked: false
    };
  }

  if (card.watermarkLocked) {
    return stripWatermarkedCard(card);
  }

  if (card.downloadUnlocked) {
    return {
      ...card,
      watermarkLocked: false
    };
  }

  if (!policy) {
    return card;
  }

  if (card.id === policy.cleanDownloadGenerationId) {
    return {
      ...card,
      downloadUnlocked: true,
      watermarkLocked: false
    };
  }

  return stripWatermarkedCard(card);
}
