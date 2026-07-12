import type { ProductCardResult } from "@/types/product-card";

export type DownloadPolicy = {
  cleanDownloadGenerationId: string | null;
  downloadsFullyUnlocked: boolean;
};

export function canDownloadCardImage(
  _card: ProductCardResult,
  _policy: DownloadPolicy | null,
  _persistToServer: boolean
) {
  return true;
}

export function applyDownloadPolicyToCard(
  card: ProductCardResult,
  _policy: DownloadPolicy | null,
  persistToServer: boolean
): ProductCardResult {
  if (!persistToServer) {
    return card;
  }

  return {
    ...card,
    downloadUnlocked: true,
    watermarkLocked: false
  };
}
