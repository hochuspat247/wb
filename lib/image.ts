const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFile(file: File) {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Изображение слишком большое. Загрузите файл до 5 МБ.";
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return "Поддерживаются только image/jpeg, image/png и image/webp.";
  }

  return null;
}

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
