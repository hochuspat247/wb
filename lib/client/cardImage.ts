import type { ProductCardResult } from "@/types/product-card";
import { downloadBase64Image, downloadImageFromUrl } from "@/lib/image";

export type DownloadCardImageResult =
  | { clean: boolean; missing?: false; blocked?: false }
  | { clean: false; missing: true; blocked?: false }
  | { clean: false; blocked: true; missing?: false };

export async function downloadCardImageAsset(
  card: ProductCardResult,
  fileName: string
): Promise<DownloadCardImageResult> {
  // Paid / unlocked: prefer clean original.
  if (card.downloadUnlocked && card.imageDownloadUrl) {
    const response = await fetch(card.imageDownloadUrl, { cache: "no-store" });

    if (response.ok) {
      await downloadResponseBlob(response, fileName);
      return { clean: true };
    }
  }

  // Free tier: watermarked preview download is allowed.
  if (card.previewImageUrl) {
    const response = await fetch(card.previewImageUrl, { cache: "no-store" });

    if (response.ok) {
      await downloadResponseBlob(response, fileName);
      return { clean: false };
    }
  }

  if (card.watermarkLocked && !card.downloadUnlocked) {
    // No preview URL available — cannot serve a watermarked file client-side from clean base64.
    return { clean: false, blocked: true };
  }

  if (card.generatedImageUrl) {
    await downloadImageFromUrl(card.generatedImageUrl, fileName);
    return { clean: !card.watermarkLocked };
  }

  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    downloadBase64Image(card.generatedImageBase64, card.generatedImageMimeType, fileName);
    return { clean: !card.watermarkLocked };
  }

  if (card.generatedImageDataUrl) {
    await downloadImageFromUrl(card.generatedImageDataUrl, fileName);
    return { clean: !card.watermarkLocked };
  }

  return { clean: false, missing: true as const };
}

async function downloadResponseBlob(response: Response, fileName: string) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
