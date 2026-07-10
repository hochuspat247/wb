const IMAGE_SETTINGS_KEY = "marketcard-ai-image-settings";

export type ImageSettings = {
  imageProvider: "auto" | "nanobanana_expert" | "gemini";
  imageMode: "fast" | "legacy" | "pro";
};

const defaults: ImageSettings = {
  imageProvider: "auto",
  imageMode: "pro"
};

export const DEFAULT_IMAGE_SETTINGS = defaults;

export function getImageSettings(): ImageSettings {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(IMAGE_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as { imageProvider?: string; imageMode?: string };
    const imageProvider =
      parsed.imageProvider === "html" || !parsed.imageProvider
        ? defaults.imageProvider
        : parsed.imageProvider === "nanobanana_expert" || parsed.imageProvider === "gemini" || parsed.imageProvider === "auto"
          ? parsed.imageProvider
          : defaults.imageProvider;
    const imageMode =
      parsed.imageMode === "html" || !parsed.imageMode
        ? defaults.imageMode
        : parsed.imageMode === "fast" || parsed.imageMode === "legacy" || parsed.imageMode === "pro"
          ? parsed.imageMode
          : defaults.imageMode;

    return { imageProvider, imageMode };
  } catch {
    return defaults;
  }
}

export function saveImageSettings(settings: ImageSettings): ImageSettings {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(IMAGE_SETTINGS_KEY, JSON.stringify(settings));
  }
  return settings;
}
