import { getImageSettings } from "@/lib/imageSettings";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import {
  NANO_BANANA_ASPECT_RATIO,
  NANO_BANANA_IMAGE_MODEL,
  NANO_BANANA_OUTPUT_FORMAT,
  NANO_BANANA_RESOLUTION,
  normalizeDesignPreset,
  normalizeProductCardInput,
  resolveNanoBananaImageProvider
} from "@/lib/marketplace/cardFormValidation";
import { dataUrlToBase64, hasGeneratedAiCover } from "@/lib/image";
import { buildPreviousCardSnapshot } from "@/lib/series/editing";
import {
  buildAppendCardSeriesPlanFromTypes,
  buildSeriesCardDescription,
  buildSeriesInfographicTexts,
  buildSeriesStyleGuide,
  getSeriesAnchorId,
  getSeriesSiblingCards,
  getSeriesStartIndex
} from "@/lib/series/plan";
import type { CardSeriesPlanItem, GenerateImageResult, ProductCardInput, ProductCardResult } from "@/types/product-card";

export function resolveProductImagePayload(card: ProductCardResult) {
  const source = card.sourceInput;

  if (source?.imageBase64 && source?.imageMimeType) {
    return {
      base64: source.imageBase64,
      mimeType: source.imageMimeType,
      dataUrl: `data:${source.imageMimeType};base64,${source.imageBase64}`
    };
  }

  if (card.imageDataUrl?.startsWith("data:")) {
    const parsed = dataUrlToBase64(card.imageDataUrl);
    return {
      base64: parsed.base64,
      mimeType: parsed.mimeType,
      dataUrl: card.imageDataUrl
    };
  }

  return null;
}

export function buildPayloadFromSourceCard(sourceCard: ProductCardResult): ProductCardInput {
  const source = sourceCard.sourceInput;

  if (source) {
    const imagePayload = resolveProductImagePayload(sourceCard);

    return normalizeProductCardInput({
      ...source,
      productDescription: source.productDescription || sourceCard.fullDescription || sourceCard.shortDescription,
      category: source.category || sourceCard.category,
      marketplace: source.marketplace || sourceCard.marketplace,
      style: source.style || sourceCard.style,
      includeSeo: source.includeSeo ?? true,
      focusBenefits: source.focusBenefits ?? true,
      includeInfographicText: source.includeInfographicText ?? true,
      imageBase64: imagePayload?.base64,
      imageMimeType: imagePayload?.mimeType,
      platform: source.platform || marketplaceLabelToPlatform(source.marketplace || sourceCard.marketplace)
    });
  }

  const imagePayload = resolveProductImagePayload(sourceCard);

  return normalizeProductCardInput({
    productDescription: sourceCard.fullDescription || sourceCard.shortDescription || sourceCard.title,
    category: sourceCard.category,
    marketplace: sourceCard.marketplace,
    style: sourceCard.style,
    includeSeo: true,
    focusBenefits: true,
    includeInfographicText: true,
    imageBase64: imagePayload?.base64,
    imageMimeType: imagePayload?.mimeType,
    platform: marketplaceLabelToPlatform(sourceCard.marketplace),
    price: sourceCard.price,
    brand: undefined
  });
}

async function createGeneratedProductCard(
  payload: ProductCardInput,
  options: {
    planItem: CardSeriesPlanItem;
    seriesId: string;
    seriesCount: number;
    seriesStyleGuide: string;
    preserveCard?: ProductCardResult;
    imageDataUrl?: string;
    headline?: string;
    price?: string;
    ctaText?: string;
    designPreset?: ProductCardResult["designPreset"];
  }
) {
  const previousCard = options.preserveCard ? buildPreviousCardSnapshot(options.preserveCard) : undefined;
  const requestPayload = {
    ...payload,
    productDescription: buildSeriesCardDescription(payload, options.planItem, options.seriesCount),
    previousCard
  };

  const response = await fetch("/api/generate-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload)
  });

  const data = (await response.json()) as ProductCardResult & {
    error?: string;
    quota?: { remaining: number; used: number; credits: number };
    imageGenerationTicket?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось создать карточку.");
  }

  const { quota: _quota, error: _error, imageGenerationTicket, ...cardPayload } = data;
  const planItem = options.planItem;
  const { imageBase64: _imageBase64, imageMimeType: _imageMimeType, ...sourceInputPayload } = requestPayload;

  const generatedCard: ProductCardResult = {
    ...(cardPayload as ProductCardResult),
    title: planItem.mainHeadline || (cardPayload as ProductCardResult).title,
    shortDescription: planItem.subheadline || (cardPayload as ProductCardResult).shortDescription,
    benefits: planItem.bullets?.length ? planItem.bullets : (cardPayload as ProductCardResult).benefits,
    infographicTexts: buildSeriesInfographicTexts(planItem),
    visualConcept: `${planItem.visualIdea}. Единый стиль серии: ${options.seriesStyleGuide}`,
    imageDataUrl: options.imageDataUrl,
    headline: options.headline,
    price: options.price,
    ctaText: options.ctaText,
    designPreset: options.designPreset,
    seriesId: options.seriesId,
    seriesIndex: planItem.index,
    seriesCount: options.seriesCount as ProductCardResult["seriesCount"],
    seriesPlanItem: planItem,
    seriesStyleGuide: options.seriesStyleGuide,
    sourceInput: {
      ...sourceInputPayload,
      headline: options.headline,
      price: options.price,
      ctaText: options.ctaText,
      designPreset: options.designPreset,
      cardsCount: options.seriesCount as ProductCardResult["seriesCount"],
      seriesIndex: planItem.index,
      seriesType: planItem.type
    }
  };

  return {
    card: generatedCard,
    quota: data.quota,
    imageGenerationTicket
  };
}

async function generateAiMarketplaceImage(
  cardForImage: ProductCardResult,
  context: {
    payload: ProductCardInput;
    imageDataUrl: string;
    marketplace: string;
    style: string;
    headline?: string;
    price?: string;
    ctaText?: string;
    designPreset?: ProductCardResult["designPreset"];
    seriesCount: number;
  },
  imageGenerationTicket?: string
) {
  const image = dataUrlToBase64(context.imageDataUrl);
  const planItem = cardForImage.seriesPlanItem;

  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productDescription: planItem
        ? buildSeriesCardDescription(context.payload, planItem, context.seriesCount)
        : context.payload.productDescription,
      category: cardForImage.category,
      style: context.style,
      marketplace: context.marketplace,
      title: cardForImage.title,
      benefits: cardForImage.benefits,
      infographicTexts: cardForImage.infographicTexts,
      characteristics: cardForImage.characteristics,
      keywords: cardForImage.keywords,
      imageBase64: image.base64,
      imageMimeType: image.mimeType,
      imageProvider: resolveNanoBananaImageProvider(getImageSettings().imageProvider),
      headline: context.headline,
      price: context.price,
      ctaText: context.ctaText,
      designPreset: normalizeDesignPreset(context.designPreset || "premium-marketplace"),
      model: NANO_BANANA_IMAGE_MODEL,
      aspectRatio: NANO_BANANA_ASPECT_RATIO,
      resolution: NANO_BANANA_RESOLUTION,
      outputFormat: NANO_BANANA_OUTPUT_FORMAT,
      imageGenerationTicket,
      seriesStyleGuide: cardForImage.seriesStyleGuide,
      seriesCardType: planItem?.type,
      seriesCardGoal: planItem?.goal,
      seriesCardVisualIdea: planItem?.visualIdea,
      badges: planItem?.badges
    })
  });

  const data = (await response.json()) as GenerateImageResult & {
    error?: string;
    quota?: { remaining: number; used: number; credits: number };
  };

  if (!response.ok) {
    throw new Error(data.error || "Не удалось сгенерировать обложку.");
  }

  const generatedImageDataUrl = data.imageBase64
    ? `data:${data.mimeType};base64,${data.imageBase64}`
    : undefined;

  return {
    card: {
      ...cardForImage,
      generatedImageUrl: data.imageUrl ?? null,
      generatedImageDataUrl,
      generatedImageProvider: data.provider,
      generatedImageBase64: data.imageBase64,
      generatedImageMimeType: data.mimeType,
      generatedImageModel: data.model,
      generatedImagePrompt: data.prompt,
      generatedImageIsFallback: false,
      generatedImageError: undefined,
      generationId: data.generationId,
      seed: data.seed
    } satisfies ProductCardResult,
    quota: data.quota
  };
}

export type GenerateCarouselCardsOptions = {
  sourceCard: ProductCardResult;
  historyCards: ProductCardResult[];
  selectedTypes: string[];
  onProgress?: (message: string) => void;
};

export async function generateCarouselCards({
  sourceCard,
  historyCards,
  selectedTypes,
  onProgress
}: GenerateCarouselCardsOptions) {
  const imagePayload = resolveProductImagePayload(sourceCard);

  if (!imagePayload?.dataUrl) {
    throw new Error("Не найдено исходное фото товара. Создайте карточку заново с загруженным фото.");
  }

  const siblings = getSeriesSiblingCards(historyCards, sourceCard);
  const seriesCards = [sourceCard, ...siblings];
  const payload = buildPayloadFromSourceCard(sourceCard);
  const seriesId = getSeriesAnchorId(sourceCard);
  const seriesStyleGuide = sourceCard.seriesStyleGuide || buildSeriesStyleGuide(payload.style, payload.marketplace);
  const headline = sourceCard.headline || sourceCard.title;
  const price = sourceCard.price || sourceCard.sourceInput?.price;
  const ctaText = sourceCard.ctaText || sourceCard.sourceInput?.ctaText;
  const designPreset = sourceCard.designPreset || sourceCard.sourceInput?.designPreset;
  const startIndex = getSeriesStartIndex(seriesCards);
  const plan = buildAppendCardSeriesPlanFromTypes(
    selectedTypes,
    {
      category: payload.category || sourceCard.category,
      marketplace: payload.marketplace,
      style: payload.style,
      productDescription: payload.productDescription,
      headline
    },
    startIndex
  );

  const totalSeriesCount = startIndex + plan.length;
  const completedCards: ProductCardResult[] = [];
  let latestQuota: { remaining: number; used: number; credits: number } | undefined;

  for (const planItem of plan) {
    onProgress?.(`Генерируем «${planItem.title}» (${planItem.index} из ${totalSeriesCount})…`);

    const { card: generatedCard, quota, imageGenerationTicket } = await createGeneratedProductCard(payload, {
      planItem,
      seriesId,
      seriesCount: totalSeriesCount,
      seriesStyleGuide,
      preserveCard: sourceCard,
      imageDataUrl: imagePayload.dataUrl,
      headline,
      price,
      ctaText,
      designPreset
    });

    latestQuota = quota;

    const { card: finalCard, quota: imageQuota } = await generateAiMarketplaceImage(
      generatedCard,
      {
        payload,
        imageDataUrl: imagePayload.dataUrl,
        marketplace: payload.marketplace,
        style: payload.style,
        headline,
        price,
        ctaText,
        designPreset,
        seriesCount: totalSeriesCount
      },
      imageGenerationTicket
    );

    latestQuota = imageQuota ?? latestQuota;

    if (!hasGeneratedAiCover(finalCard)) {
      throw new Error(`Не удалось сгенерировать обложку для «${planItem.title}».`);
    }

    completedCards.push(finalCard);
  }

  return {
    cards: completedCards,
    quota: latestQuota
  };
}
