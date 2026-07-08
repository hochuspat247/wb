import type { ProductCardResult } from "@/types/product-card";
import { downloadBase64Image, downloadImageFromUrl } from "@/lib/image";

export async function downloadCardImageAsset(card: ProductCardResult, fileName: string) {
  if (card.imageDownloadUrl) {
    const response = await fetch(card.imageDownloadUrl, { cache: "no-store" });

    if (response.ok) {
      await downloadResponseBlob(response, fileName);
      return { clean: true };
    }
  }

  if (card.previewImageUrl) {
    const response = await fetch(card.previewImageUrl, { cache: "no-store" });

    if (response.ok) {
      await downloadResponseBlob(response, fileName);
      return { clean: Boolean(card.downloadUnlocked) };
    }
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
