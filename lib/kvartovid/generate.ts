import { callGigaChatJson } from "@/lib/ai/gigachat";
import { assessGenerationContentPolicy } from "@/lib/ai/contentPolicy";
import { IMAGE_GENERATION_RETRY_MESSAGE } from "@/lib/ai/imageGenerationErrors";
import { generateNanoBananaExpertImage, isNanoBananaExpertConfigured } from "@/lib/ai/nanobananaExpert";
import { extractJsonObject } from "@/lib/json";
import { buildKvartovidCoverPrompt, buildKvartovidListingPrompt } from "@/lib/kvartovid/prompt";
import type { KvartovidListingInput, KvartovidListingResult } from "@/types/kvartovid";
import type { GenerateImageInput } from "@/types/product-card";

type RawListingResponse = {
  title?: string;
  description?: string;
  advantages?: string[];
  suggestedHighlights?: string[];
  bestPhotoIndex?: number;
  qualityScore?: number;
  qualityTips?: string[];
};

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, max);
}

function clampPhotoIndex(index: number, photoCount: number) {
  if (!Number.isFinite(index) || photoCount <= 0) return 0;
  return Math.min(Math.max(0, Math.floor(index)), photoCount - 1);
}

function buildCoverImageInput(
  input: KvartovidListingInput,
  title: string,
  advantages: string[],
  photo: { base64: string; mimeType: string }
): GenerateImageInput {
  const coverPrompt = buildKvartovidCoverPrompt(input, title, advantages);

  return {
    productDescription: coverPrompt,
    category: "Недвижимость",
    marketplace: "Авито",
    style: "Премиальный",
    title,
    benefits: advantages,
    infographicTexts: advantages,
    imageBase64: photo.base64,
    imageMimeType: photo.mimeType,
    headline: title,
    price: input.price?.trim() || "Цена по запросу",
    ctaText: "Запишитесь на просмотр",
    designPreset: "premium-marketplace",
    model: "nb2",
    aspectRatio: "4:3",
    resolution: "1k",
    outputFormat: "png"
  };
}

export async function generateKvartovidListing(
  input: KvartovidListingInput,
  options: { includeCover?: boolean } = {}
): Promise<KvartovidListingResult> {
  const photoCount = input.photos.length;
  const prompt = buildKvartovidListingPrompt(input, photoCount);
  const rawText = await callGigaChatJson(prompt, { temperature: 0.35, maxTokens: 2500 });
  const parsed = JSON.parse(extractJsonObject(rawText)) as RawListingResponse;

  const advantages = asStringArray(parsed.advantages, 6);
  const suggestedHighlights = asStringArray(parsed.suggestedHighlights, 12);
  const selected =
    input.selectedHighlights?.filter(Boolean).slice(0, 6) ??
    advantages.slice(0, 4);

  const bestPhotoIndex = clampPhotoIndex(Number(parsed.bestPhotoIndex ?? 0), photoCount);
  const title = String(parsed.title ?? "").trim() || "Квартира в хорошем районе";
  const description = String(parsed.description ?? "").trim() || "Описание будет дополнено после уточнения параметров.";

  const result: KvartovidListingResult = {
    title,
    description,
    advantages: selected.length ? selected : advantages,
    suggestedHighlights: suggestedHighlights.length ? suggestedHighlights : advantages,
    bestPhotoIndex,
    qualityScore: typeof parsed.qualityScore === "number" ? Math.round(parsed.qualityScore) : undefined,
    qualityTips: asStringArray(parsed.qualityTips, 6),
    generatedAt: new Date().toISOString()
  };

  const includeCover = options.includeCover ?? input.includeCover ?? true;

  if (includeCover && input.photos[bestPhotoIndex]) {
    if (!isNanoBananaExpertConfigured()) {
      result.coverImageError = "NanoBanana Expert не настроен (NANOBANANA_EXPERT_API_KEY).";
    } else {
      const photo = input.photos[bestPhotoIndex];
      const imageInput = buildCoverImageInput(input, title, result.advantages, photo);

      const imagePolicy = await assessGenerationContentPolicy({
        productDescription: imageInput.productDescription,
        category: imageInput.category,
        title: imageInput.title,
        benefits: imageInput.benefits,
        infographicTexts: imageInput.infographicTexts,
        imageBase64: imageInput.imageBase64,
        imageMimeType: imageInput.imageMimeType
      });

      if (!imagePolicy.allowed) {
        result.coverImageError = imagePolicy.error;
      } else {
        const image = await generateNanoBananaExpertImage(imageInput);

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
  }

  return result;
}
