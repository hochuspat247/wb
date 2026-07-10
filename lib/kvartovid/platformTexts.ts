import { KVARTOVID_PLATFORMS } from "@/lib/kvartovid/constants";
import type { KvartovidPlatformId, KvartovidPlatformText } from "@/types/kvartovid";

type RawPlatformText = {
  title?: string;
  description?: string;
};

type RawPlatformTexts = Partial<Record<KvartovidPlatformId, RawPlatformText>>;

export function normalizePlatformTexts(
  raw: RawPlatformTexts | undefined,
  fallbackTitle: string,
  fallbackDescription: string
): KvartovidPlatformText[] {
  return KVARTOVID_PLATFORMS.map((platform) => {
    const entry = raw?.[platform.id];
    const title = String(entry?.title ?? fallbackTitle).trim() || fallbackTitle;
    const description = String(entry?.description ?? fallbackDescription).trim() || fallbackDescription;

    return {
      platform: platform.id,
      label: platform.label,
      title,
      description
    };
  });
}

export function formatPlatformTextsForExport(platformTexts: KvartovidPlatformText[]) {
  return platformTexts
    .map((item) => [`=== ${item.label} ===`, item.title, "", item.description, ""].join("\n"))
    .join("\n");
}
