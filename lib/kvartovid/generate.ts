import { callGigaChatJson } from "@/lib/ai/gigachat";
import { IMAGE_GENERATION_RETRY_MESSAGE } from "@/lib/ai/imageGenerationErrors";
import { isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import { extractJsonObject } from "@/lib/json";
import { buildKvartovidCoverHeadline, generateKvartovidCoverImage } from "@/lib/kvartovid/coverImage";
import { generateKvartovidFloorPlan } from "@/lib/kvartovid/floorPlan";
import { buildKvartovidListingPrompt } from "@/lib/kvartovid/prompt";
import { normalizePlatformTexts } from "@/lib/kvartovid/platformTexts";
import type { KvartovidListingInput, KvartovidListingResult, KvartovidPlatformId } from "@/types/kvartovid";

type RawListingResponse = {
  title?: string;
  description?: string;
  advantages?: string[];
  suggestedHighlights?: string[];
  bestPhotoIndex?: number;
  qualityScore?: number;
  qualityTips?: string[];
  platformTexts?: Partial<Record<KvartovidPlatformId, { title?: string; description?: string }>>;
};

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, max);
}

function clampPhotoIndex(index: number, photoCount: number) {
  if (!Number.isFinite(index) || photoCount <= 0) return 0;
  return Math.min(Math.max(0, Math.floor(index)), photoCount - 1);
}

export async function generateKvartovidListing(
  input: KvartovidListingInput,
  options: { includeCover?: boolean; includeFloorPlan?: boolean } = {}
): Promise<KvartovidListingResult> {
  const photoCount = input.photos.length;
  const prompt = buildKvartovidListingPrompt(input, photoCount);
  const rawText = await callGigaChatJson(prompt, { temperature: 0.35, maxTokens: 4000 });
  const parsed = JSON.parse(extractJsonObject(rawText)) as RawListingResponse;

  const advantages = asStringArray(parsed.advantages, 6);
  const suggestedHighlights = asStringArray(parsed.suggestedHighlights, 12);
  const selected =
    input.selectedHighlights?.filter(Boolean).slice(0, 6) ??
    advantages.slice(0, 4);

  const bestPhotoIndex = clampPhotoIndex(Number(parsed.bestPhotoIndex ?? 0), photoCount);
  const title = String(parsed.title ?? "").trim() || "Квартира в хорошем районе";
  const description = String(parsed.description ?? "").trim() || "Описание будет дополнено после уточнения параметров.";
  const platformTexts = normalizePlatformTexts(parsed.platformTexts, title, description);

  const result: KvartovidListingResult = {
    title,
    description,
    platformTexts,
    advantages: selected.length ? selected : advantages,
    suggestedHighlights: suggestedHighlights.length ? suggestedHighlights : advantages,
    bestPhotoIndex,
    qualityScore: typeof parsed.qualityScore === "number" ? Math.round(parsed.qualityScore) : undefined,
    qualityTips: asStringArray(parsed.qualityTips, 6),
    generatedAt: new Date().toISOString()
  };

  const includeCover = options.includeCover ?? input.includeCover ?? true;
  const includeFloorPlan = options.includeFloorPlan ?? input.includeFloorPlan ?? true;

  if (includeFloorPlan) {
    const floorPlan = await generateKvartovidFloorPlan(input);
    result.floorPlanSvg = floorPlan.svg;
    result.floorPlanLayout = floorPlan.layout;
    if (floorPlan.error) {
      result.floorPlanError = floorPlan.error;
    }
  }

  if (includeCover && input.photos[bestPhotoIndex]) {
    if (!isNanoBananaExpertConfigured()) {
      result.coverImageError = "NanoBanana Expert не настроен (NANOBANANA_EXPERT_API_KEY).";
    } else {
      const photo = input.photos[bestPhotoIndex];
      const avitoTitle = platformTexts.find((item) => item.platform === "avito")?.title;
      const coverHeadline = buildKvartovidCoverHeadline(input, title, avitoTitle);
      const image = await generateKvartovidCoverImage(input, photo, coverHeadline, result.advantages);

      if (image.imageBase64 || image.imageUrl) {
        result.coverImageBase64 = image.imageBase64 ?? undefined;
        result.coverImageMimeType = image.mimeType ?? "image/png";
        result.coverImageUrl = image.imageUrl ?? null;
        result.coverImageProvider = image.provider;
        result.coverImageModel = image.model;
      } else {
        result.coverImageError = image.error || IMAGE_GENERATION_RETRY_MESSAGE;
      }
    }
  }

  return result;
}
