const IMAGE_SETTINGS_KEY = "marketcard-ai-image-settings";

export type ImageSettings = {
  imageProvider: "auto" | "html" | "nanobanana_expert" | "gemini";
  imageMode: "html" | "fast" | "legacy" | "pro";
};

const defaults: ImageSettings = {
  imageProvider: "auto",
  imageMode: "pro"
};

export function getImageSettings(): ImageSettings {
  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(IMAGE_SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ImageSettings>;
    return {
      imageProvider: parsed.imageProvider ?? defaults.imageProvider,
      imageMode: parsed.imageMode ?? defaults.imageMode
    };
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
