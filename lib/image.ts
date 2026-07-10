const DEFAULT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const HERO_MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File, maxSizeBytes = DEFAULT_MAX_IMAGE_SIZE_BYTES) {
  const maxSizeMb = Math.round(maxSizeBytes / (1024 * 1024));

  if (file.size > maxSizeBytes) {
    return `Изображение слишком большое. Загрузите файл до ${maxSizeMb} МБ.`;
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return "Поддерживаются только JPG и PNG.";
  }

  return null;
}

export const HERO_IMAGE_MAX_BYTES = HERO_MAX_IMAGE_SIZE_BYTES;

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

export function downloadBase64Image(base64: string, mimeType: string, fileName: string) {
  const blob = base64ToBlob(base64, mimeType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function dataUrlToBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return {
      mimeType: "image/jpeg",
      base64: dataUrl
    };
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}

export function base64ToDataUrl(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`;
}

export function getInlineGeneratedCoverSrc(card: {
  generatedImageIsFallback?: boolean;
  generatedImageBase64?: string | null;
  generatedImageMimeType?: string | null;
  generatedImageDataUrl?: string;
  generatedImageUrl?: string | null;
}) {
  if (card.generatedImageIsFallback) {
    return null;
  }

  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType);
  }

  if (card.generatedImageDataUrl) {
    return card.generatedImageDataUrl;
  }

  if (card.generatedImageUrl) {
    return card.generatedImageUrl;
  }

  return null;
}

export function getGeneratedCoverSrc(card: {
  generatedImageBase64?: string | null;
  generatedImageMimeType?: string | null;
  generatedImageDataUrl?: string;
  generatedImageUrl?: string | null;
  watermarkLocked?: boolean;
  previewImageUrl?: string;
}) {
  const inline = getInlineGeneratedCoverSrc(card);

  if (inline) {
    return inline;
  }

  if (card.previewImageUrl) {
    return card.previewImageUrl;
  }

  return null;
}

export function hasGeneratedAiCover(card: {
  generatedImageIsFallback?: boolean;
  generatedImageBase64?: string | null;
  generatedImageMimeType?: string | null;
  generatedImageDataUrl?: string;
  generatedImageUrl?: string | null;
}) {
  return Boolean(!card.generatedImageIsFallback && getGeneratedCoverSrc(card));
}

export async function downloadImageFromUrl(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("fetch failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    window.open(imageUrl, "_blank", "noopener,noreferrer");
  }
}

export function resizeImageToDataUrl(file: File, maxSize = 1400) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas is not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать изображение."));
    };
    img.src = objectUrl;
  });
}
