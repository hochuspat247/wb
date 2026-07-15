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
  // Watermarked preview download is always allowed; clean original needs purchase.
  return true;
}

export function applyDownloadPolicyToCard(
  card: ProductCardResult,
  policy: DownloadPolicy | null,
  persistToServer: boolean
): ProductCardResult {
  if (!persistToServer) {
    return card;
  }

  const unlocked = Boolean(policy?.downloadsFullyUnlocked);

  return {
    ...card,
    downloadUnlocked: unlocked,
    watermarkLocked: !unlocked
  };
}
