"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Download, FileImage, ImageUp, Loader2, RefreshCcw, RotateCcw, Wand2 } from "lucide-react";
import { GeneratedCardPreview } from "@/components/GeneratedCardPreview";
import { HistorySection } from "@/components/HistorySection";
import { PaywallModal } from "@/components/PaywallModal";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { ResultPanel } from "@/components/ResultPanel";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { SkeletonBlock } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getImageSettings } from "@/lib/imageSettings";
import { detectCategory } from "@/lib/category";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import { createPreviewPngDataUrl, downloadPreviewPng } from "@/lib/download";
import {
  base64ToBlob,
  base64ToDataUrl,
  dataUrlToBase64,
  downloadBase64Image,
  downloadImageFromUrl,
  validateImageFile
} from "@/lib/image";
import { clearHistory, getHistory, removeFromHistory, saveToHistory } from "@/lib/storage";
import { fetchUserQuota, saveUserCardRemote } from "@/lib/api/user";
import { reachGoal } from "@/lib/metrika";
import type {
  GenerateImageResult,
  CardSeriesCount,
  CardSeriesPlanItem,
  ImageDesignPreset,
  ImageGenerationMode,
  ProductCardInput,
  ProductCardResult
} from "@/types/product-card";
import type { MarketplaceTextMode } from "@/types/marketplace";

const marketplaces = ["Wildberries", "Ozon", "Avito", "Яндекс Маркет"];
const styles = ["Минималистичный", "Премиальный", "Яркий", "Нежный", "Технологичный"];
const cardCountOptions: CardSeriesCount[] = [1, 3, 5, 7, 10];

const designPresets: Array<{ label: string; value: ImageDesignPreset }> = [
  { label: "Premium Marketplace", value: "premium-marketplace" },
  { label: "Luxury Catalog", value: "luxury-catalog" },
  { label: "Standard", value: "standard" }
];

const imageModes: Array<{ label: string; value: ImageGenerationMode }> = [
  { label: "AI-обложка (авто)", value: "pro" },
  { label: "Быстрая генерация", value: "fast" },
  { label: "Базовая обложка 4:5", value: "html" }
];

const textModes: Array<{ label: string; value: MarketplaceTextMode }> = [
  { label: "Безопасно для модерации", value: "marketplace_safe" },
  { label: "Промо-креатив", value: "promo_creative" },
  { label: "SEO-описание", value: "seo" },
  { label: "Полная карточка", value: "full_listing" }
];

export function CardGenerator({
  hideHistory = false,
  onSaved,
  onQuotaChange,
  embedded = false,
  persistToServer = false,
  darkConsole = false
}: {
  hideHistory?: boolean;
  onSaved?: () => void;
  onQuotaChange?: (quota: { remaining: number; used: number; credits: number }) => void;
  embedded?: boolean;
  persistToServer?: boolean;
  darkConsole?: boolean;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [marketplace, setMarketplace] = useState("Wildberries");
  const [textMode, setTextMode] = useState<MarketplaceTextMode>("marketplace_safe");
  const [brand, setBrand] = useState("");
  const [sellerSku, setSellerSku] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [weight, setWeight] = useState("");
  const [packageContents, setPackageContents] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [useCase, setUseCase] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [style, setStyle] = useState("Премиальный");
  const [cardsCount, setCardsCount] = useState<CardSeriesCount>(1);
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [designPreset, setDesignPreset] = useState<ImageDesignPreset>("premium-marketplace");
  const [imageMode, setImageMode] = useState<ImageGenerationMode>("pro");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [card, setCard] = useState<ProductCardResult | null>(null);
  const [seriesCards, setSeriesCards] = useState<ProductCardResult[]>([]);
  const [seriesProgress, setSeriesProgress] = useState("");
  const [history, setHistory] = useState<ProductCardResult[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState("");
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!persistToServer) return;

    fetchUserQuota()
      .then((quota) => {
        setRemainingGenerations(quota.remaining);
        onQuotaChange?.(quota);
      })
      .catch(() => setRemainingGenerations(null));
  }, [persistToServer, onQuotaChange]);

  const effectiveCategory = useMemo(() => detectCategory(description, category), [category, description]);
  const seriesPlan = useMemo(
    () =>
      buildCardSeriesPlan({
        count: cardsCount,
        category: effectiveCategory,
        marketplace,
        style,
        productDescription: description,
        headline
      }),
    [cardsCount, description, effectiveCategory, headline, marketplace, style]
  );
  const selectedCountExceedsQuota =
    persistToServer && remainingGenerations !== null && cardsCount > remainingGenerations;

  useEffect(() => {
    setHistory(getHistory());
    const settings = getImageSettings();
    setImageMode(settings.imageMode);
  }, []);

  useEffect(() => {
    if (!card) {
      setRenderedImageUrl("");
      return;
    }

    const cardHasAiCover = Boolean(
      !card.generatedImageIsFallback &&
      (card.generatedImageUrl || (card.generatedImageBase64 && card.generatedImageMimeType))
    );

    if (cardHasAiCover) {
      setRenderedImageUrl("");
      setIsRenderingImage(false);
      return;
    }

    let cancelled = false;
    setIsRenderingImage(true);
    setRenderedImageUrl("");

    const timer = window.setTimeout(async () => {
      try {
        const dataUrl = await createPreviewPngDataUrl(previewRef.current);

        if (!cancelled) {
          setRenderedImageUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setNotice("Карточка готова. Нажмите «Скачать PNG», чтобы сохранить файл.");
        }
      } finally {
        if (!cancelled) {
          setIsRenderingImage(false);
        }
      }
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [card, imageUrl, style]);

  async function handleImage(file?: File) {
    if (!file) {
      return;
    }

    const validationError = validateImageFile(file);

    if (validationError) {
      setError(validationError);
      setImageFileName("");
      return;
    }

    setError("");
    setImageFileName(file.name);
    reachGoal("upload_photo", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    const dataUrl = await resizeImageToDataUrl(file);
    setImageUrl(dataUrl);
  }

  async function handleBackgroundRemoval() {
    if (!imageUrl) {
      return;
    }

    try {
      const module = await import("@imgly/background-removal");
      const imageBlob = await module.removeBackground(imageUrl);
      const dataUrl = await readAsDataUrl(imageBlob);
      setImageUrl(dataUrl);
    } catch {
      setNotice("Не удалось убрать фон. Попробуйте другое фото или отключите эту опцию.");
    }
  }

  async function createGeneratedProductCard(
    payload: ProductCardInput,
    options: {
      planItem?: CardSeriesPlanItem;
      seriesId?: string;
      seriesCount?: CardSeriesCount;
    } = {}
  ) {
    const requestPayload = options.planItem
      ? {
          ...payload,
          productDescription: buildSeriesCardDescription(payload, options.planItem, options.seriesCount ?? cardsCount)
        }
      : payload;

    const response = await fetch("/api/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });
    const data = (await response.json()) as ProductCardResult & {
      error?: string;
      quota?: { remaining: number; used: number; credits: number };
    };

    if (!response.ok) {
      if (response.status === 402) {
        setRemainingGenerations(data.quota?.remaining ?? 0);
        if (data.quota) onQuotaChange?.(data.quota);
        setShowPaywall(true);
      }
      throw new Error(data.error || "Не удалось создать карточку. Попробуйте ещё раз.");
    }

    if (data.quota?.remaining !== undefined) {
      setRemainingGenerations(data.quota.remaining);
      onQuotaChange?.(data.quota);
    }

    const { quota: _quota, error: _error, ...cardPayload } = data;
    const planItem = options.planItem;
    const generatedCard: ProductCardResult = {
      ...(cardPayload as ProductCardResult),
      title: planItem?.mainHeadline || (cardPayload as ProductCardResult).title,
      shortDescription: planItem?.subheadline || (cardPayload as ProductCardResult).shortDescription,
      benefits: planItem?.bullets.length
        ? planItem.bullets
        : Array.isArray((data as ProductCardResult).benefits)
          ? (data as ProductCardResult).benefits
          : [],
      keywords: Array.isArray((data as ProductCardResult).keywords) ? (data as ProductCardResult).keywords : [],
      infographicTexts: planItem
        ? buildSeriesInfographicTexts(planItem)
        : Array.isArray((data as ProductCardResult).infographicTexts)
          ? (data as ProductCardResult).infographicTexts
          : [],
      visualConcept: planItem
        ? `${planItem.visualIdea}. Единый стиль серии: ${buildSeriesStyleGuide(style, marketplace)}`
        : (cardPayload as ProductCardResult).visualConcept,
      imageDataUrl: imageUrl || undefined,
      headline: planItem?.mainHeadline || headline.trim() || undefined,
      price: price.trim() || undefined,
      ctaText: ctaText.trim() || undefined,
      designPreset,
      seriesId: options.seriesId,
      seriesIndex: planItem?.index,
      seriesCount: options.seriesCount,
      seriesPlanItem: planItem,
      seriesStyleGuide: options.seriesId ? buildSeriesStyleGuide(style, marketplace) : undefined,
      sourceInput: {
        ...payload,
        headline: planItem?.mainHeadline || headline.trim() || undefined,
        price: price.trim() || undefined,
        ctaText: ctaText.trim() || undefined,
        designPreset,
        imageMode,
        removeBackground,
        cardsCount: options.seriesCount ?? cardsCount,
        seriesIndex: planItem?.index,
        seriesType: planItem?.type
      }
    };

    return {
      card: generatedCard,
      quota: data.quota
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSeriesProgress("");

    if (!description.trim()) {
      setError("Опишите товар — хотя бы в двух словах.");
      return;
    }

    if (!imageUrl) {
      setError("Загрузите фото товара — без него обложка не получится.");
      return;
    }

    if (persistToServer && remainingGenerations === 0) {
      setShowPaywall(true);
      return;
    }

    if (selectedCountExceedsQuota) {
      setError(
        `Для серии нужно ${cardsCount} генераций, а доступно ${remainingGenerations}. Уменьшите количество карточек или купите пакет.`
      );
      setShowPaywall(true);
      return;
    }

    if (removeBackground) {
      await handleBackgroundRemoval();
    }

    setIsLoading(true);
    setSeriesCards([]);
    const payload: ProductCardInput = {
      productDescription: description,
      category: effectiveCategory,
      marketplace,
      style,
      includeSeo: true,
      focusBenefits: true,
      includeInfographicText: true,
      imageFileName,
      platform: marketplaceLabelToPlatform(marketplace),
      textMode,
      brand: brand.trim() || undefined,
      sellerSku: sellerSku.trim() || undefined,
      color: color.trim() || undefined,
      size: size.trim() || undefined,
      material: material.trim() || undefined,
      dimensions: dimensions.trim() || undefined,
      weight: weight.trim() || undefined,
      packageContents: packageContents.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
      useCase: useCase.trim() || undefined,
      price: price.trim() || undefined,
      oldPrice: oldPrice.trim() || undefined,
      discount: discount.trim() || undefined
    };

    try {
      if (cardsCount === 1) {
        const { card: generatedCard, quota } = await createGeneratedProductCard(payload);
        setCard(generatedCard);
        setNotice("Создаём обложку…");
        const finalCard = await generateAiMarketplaceImage(generatedCard);
        await persistGeneratedCard(finalCard ?? generatedCard);

        trackConversion("generation_complete", { marketplace, platform: payload.platform || "wildberries" });
        reachGoal("generate_card", {
          marketplace,
          designPreset,
          cardsCount,
          hasImage: hasGeneratedImage(finalCard ?? generatedCard)
        });

        if (quota?.remaining === 0) {
          setShowPaywall(true);
        }
        return;
      }

      const seriesId = crypto.randomUUID();
      const completedCards: ProductCardResult[] = [];

      for (const planItem of seriesPlan) {
        try {
          setSeriesProgress(`Генерируется карточка ${planItem.index} из ${cardsCount}`);
          setNotice(`Генерируется карточка ${planItem.index} из ${cardsCount}: ${planItem.title}`);
          const { card: generatedCard } = await createGeneratedProductCard(payload, {
            planItem,
            seriesId,
            seriesCount: cardsCount
          });
          setCard(generatedCard);
          const finalCard = await generateAiMarketplaceImage(generatedCard);
          const readyCard = finalCard ?? generatedCard;
          completedCards.push(readyCard);
          setSeriesCards([...completedCards]);
          await persistGeneratedCard(readyCard, { silent: true });
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Не удалось создать карточку.";
          const isQuotaError = /генерац|пакет|лимит/i.test(message);

          if (isQuotaError) {
            setError(message);
            setShowPaywall(true);
            break;
          }

          completedCards.push(buildFailedSeriesCard(payload, planItem, seriesId, cardsCount, imageUrl, message));
          setSeriesCards([...completedCards]);
          setError(`Карточка ${planItem.index} не сгенерировалась: ${message}`);
        }
      }

      const readyCards = completedCards.filter((item) => item.provider !== "Series plan");

      if (readyCards.length) {
        setCard(readyCards[readyCards.length - 1]);
        setNotice(`Готово: создано ${readyCards.length} из ${cardsCount} карточек серии.`);
        trackConversion("generation_complete", {
          marketplace,
          platform: payload.platform || "wildberries",
          cardsCount
        });
        reachGoal("generate_card", {
          marketplace,
          designPreset,
          cardsCount,
          hasImage: readyCards.some(hasGeneratedImage)
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать карточку. Попробуйте ещё раз.");
    } finally {
      setSeriesProgress("");
      setIsLoading(false);
    }
  }

  function handleClear() {
    setDescription("");
    setCategory("");
    setMarketplace("Wildberries");
    setTextMode("marketplace_safe");
    setBrand("");
    setSellerSku("");
    setColor("");
    setSize("");
    setMaterial("");
    setDimensions("");
    setWeight("");
    setPackageContents("");
    setTargetAudience("");
    setUseCase("");
    setOldPrice("");
    setDiscount("");
    setStyle("Премиальный");
    setCardsCount(1);
    setHeadline("");
    setPrice("");
    setCtaText("");
    setDesignPreset("premium-marketplace");
    setImageMode("pro");
    setRemoveBackground(false);
    setImageUrl("");
    setImageFileName("");
    setCard(null);
    setSeriesCards([]);
    setSeriesProgress("");
    setRenderedImageUrl("");
    setError("");
    setNotice("");
  }

  async function persistGeneratedCard(cardToSave: ProductCardResult, options: { silent?: boolean } = {}) {
    if (!persistToServer) {
      return;
    }

    const nextCard = {
      ...cardToSave,
      headline: headline.trim() || cardToSave.headline,
      price: price.trim() || cardToSave.price,
      ctaText: ctaText.trim() || cardToSave.ctaText,
      designPreset: cardToSave.designPreset || designPreset
    };

    try {
      const saved = await saveUserCardRemote(nextCard);
      setHistory(saved);
      onSaved?.();
      reachGoal("save_to_history", { automatic: true });
      if (!options.silent) {
        setNotice("Готово! Карточка сохранена в историю. Скачайте PNG или JSON.");
      }
    } catch {
      if (!options.silent) {
        setNotice("Карточка создана. Нажмите «Сохранить в историю», если она не появилась автоматически.");
      }
    }
  }

  async function handleSave() {
    if (!card) {
      return;
    }

    const nextCard = {
      ...card,
      headline: headline.trim() || card.headline,
      price: price.trim() || card.price,
      ctaText: ctaText.trim() || card.ctaText,
      designPreset: card.designPreset || designPreset
    };

    if (persistToServer) {
      try {
        const saved = await saveUserCardRemote(nextCard);
        setHistory(saved);
      } catch {
        setError("Не удалось сохранить карточку в аккаунт.");
        return;
      }
    } else {
      setHistory(saveToHistory(nextCard));
    }

    onSaved?.();
    reachGoal("save_to_history");
    setNotice("Карточка сохранена.");
  }

  function handleOpenHistory(cardFromHistory: ProductCardResult) {
    setCard(cardFromHistory);
    setMarketplace(cardFromHistory.marketplace);
    setTextMode(cardFromHistory.textMode ?? "marketplace_safe");
    setStyle(cardFromHistory.style);
    setCategory(cardFromHistory.category);
    setHeadline(cardFromHistory.headline || "");
    setPrice(cardFromHistory.price || "");
    setCtaText(cardFromHistory.ctaText || "");
    setDesignPreset(cardFromHistory.designPreset || "premium-marketplace");
    setImageUrl(cardFromHistory.imageDataUrl ?? "");
    setImageFileName(cardFromHistory.imageDataUrl ? "Фото из истории" : "");
    setNotice("Карточка открыта.");
  }

  async function handleDownloadBestImage() {
    if (!card) {
      return;
    }

    reachGoal("download_png");
    await downloadBestImage(card, renderedImageUrl, previewRef.current);
  }

  async function handleDownloadSeriesCard(seriesCard: ProductCardResult, index: number) {
    reachGoal("download_png", { source: "series", seriesIndex: seriesCard.seriesIndex ?? index + 1 });
    await downloadCardImage(seriesCard, `marketcard-series-${seriesCard.seriesIndex ?? index + 1}.png`);
  }

  async function handleDownloadSeriesZip() {
    const files = await Promise.all(
      seriesCards.map(async (seriesCard, index) => {
        const blob = await getCardImageBlob(seriesCard);

        if (!blob) return null;

        return {
          name: `marketcard-${String(seriesCard.seriesIndex ?? index + 1).padStart(2, "0")}.png`,
          blob
        };
      })
    );
    const readyFiles = files.filter((file): file is { name: string; blob: Blob } => Boolean(file));

    if (!readyFiles.length) {
      setError("В серии пока нет готовых PNG для архива.");
      return;
    }

    const zipBlob = await createZipBlob(readyFiles);
    const url = URL.createObjectURL(zipBlob);
    triggerBrowserDownload(url, "marketcard-series.zip");
    URL.revokeObjectURL(url);
    reachGoal("download_json", { source: "series_zip", count: readyFiles.length });
  }

  async function handleRetrySeriesCard(cardToRetry: ProductCardResult) {
    const planItem = cardToRetry.seriesPlanItem;

    if (!planItem) {
      setError("Не удалось определить блок серии для повтора.");
      return;
    }

    if (persistToServer && remainingGenerations === 0) {
      setShowPaywall(true);
      return;
    }

    const payload = cardToRetry.sourceInput ?? {
      productDescription: description,
      category: effectiveCategory,
      marketplace,
      style,
      includeSeo: true,
      focusBenefits: true,
      includeInfographicText: true,
      imageFileName,
      platform: marketplaceLabelToPlatform(marketplace),
      textMode
    };

    setError("");
    setNotice(`Повторяем карточку ${planItem.index} из ${cardToRetry.seriesCount ?? cardsCount}`);
    setIsLoading(true);

    try {
      const { card: generatedCard } = await createGeneratedProductCard(payload, {
        planItem,
        seriesId: cardToRetry.seriesId,
        seriesCount: cardToRetry.seriesCount ?? cardsCount
      });
      setCard(generatedCard);
      const finalCard = await generateAiMarketplaceImage(generatedCard);
      const readyCard = finalCard ?? generatedCard;
      setSeriesCards((items) => items.map((item) => (item.seriesIndex === planItem.index ? readyCard : item)));
      await persistGeneratedCard(readyCard, { silent: true });
      setNotice(`Карточка ${planItem.index} обновлена.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось повторить карточку.");
    } finally {
      setIsLoading(false);
    }
  }

  function applyImageResult(cardForImage: ProductCardResult, data: GenerateImageResult) {
    const hasRemoteImage = Boolean(data.imageUrl);
    const hasBase64Image = Boolean(data.imageBase64 && data.mimeType);

    if (data.isFallback || (!hasRemoteImage && !hasBase64Image)) {
      const updatedCard = {
        ...cardForImage,
        generatedImageUrl: null,
        generatedImageBase64: null,
        generatedImageMimeType: null,
        generatedImageDataUrl: undefined,
        generatedImageProvider: data.provider,
        generatedImageModel: data.model,
        generatedImagePrompt: data.prompt,
        generatedImageIsFallback: true,
        generatedImageError: data.error,
        bananasSpent: data.bananasSpent,
        usedCoupon: data.usedCoupon,
        generationId: data.generationId,
        seed: data.seed
      };
      setCard(updatedCard);
      return updatedCard;
    }

    const generatedImageDataUrl = hasBase64Image
      ? base64ToDataUrl(data.imageBase64 as string, data.mimeType as string)
      : undefined;

    const updatedCard = {
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
      bananasSpent: data.bananasSpent,
      usedCoupon: data.usedCoupon,
      generationId: data.generationId,
      seed: data.seed
    };
    setCard(updatedCard);
    return updatedCard;
  }

  async function generateAiMarketplaceImage(cardForImage: ProductCardResult): Promise<ProductCardResult | null> {
    const productImage = imageUrl || cardForImage.imageDataUrl;

    if (!productImage) {
      setNotice("Тексты готовы. Загрузите фото, чтобы создать обложку.");
      return cardForImage;
    }

    setIsGeneratingAiImage(true);

    try {
      const image = dataUrlToBase64(productImage);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: cardForImage.seriesPlanItem
            ? buildSeriesCardDescription(cardForImage.sourceInput ?? {
                productDescription: description,
                category: cardForImage.category,
                marketplace,
                style,
                includeSeo: true,
                focusBenefits: true,
                includeInfographicText: true
              }, cardForImage.seriesPlanItem, cardForImage.seriesCount ?? cardsCount)
            : description,
          category: cardForImage.category,
          style,
          marketplace,
          title: cardForImage.title,
          benefits: cardForImage.benefits,
          infographicTexts: cardForImage.infographicTexts,
          characteristics: cardForImage.characteristics,
          keywords: cardForImage.keywords,
          imageBase64: image.base64,
          imageMimeType: image.mimeType,
          imageProvider: getImageSettings().imageProvider,
          imageMode,
          headline: headline.trim() || undefined,
          price: price.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          designPreset,
          model: "nb2",
          aspectRatio: "4:5",
          resolution: "1k",
          outputFormat: "png",
          seriesStyleGuide: cardForImage.seriesStyleGuide,
          seriesCardType: cardForImage.seriesPlanItem?.type,
          seriesCardGoal: cardForImage.seriesPlanItem?.goal,
          seriesCardVisualIdea: cardForImage.seriesPlanItem?.visualIdea,
          badges: cardForImage.seriesPlanItem?.badges
        })
      });
      const data = (await response.json()) as GenerateImageResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать обложку.");
      }

      const updatedCard = applyImageResult(cardForImage, data);

      if (data.isFallback || (!data.imageUrl && !data.imageBase64)) {
        setNotice(
          data.error
            ? `NanoBanana не вернул AI-изображение: ${data.error}. Показан fallback-preview.`
            : "NanoBanana не вернул AI-изображение. Показан fallback-preview."
        );
        return updatedCard;
      }

      setNotice("Готово! Скачайте карточку и загрузите на маркетплейс.");
      return updatedCard;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Неизвестная ошибка генерации изображения";
      setNotice(`Текст готов, но AI-изображение не создалось: ${message}. Показан fallback-preview.`);
      return cardForImage;
    } finally {
      setIsGeneratingAiImage(false);
    }
  }

  const aiImageUrl =
    card?.generatedImageUrl ||
    (card?.generatedImageBase64 && card.generatedImageMimeType
      ? base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType)
      : card?.generatedImageDataUrl) ||
    null;

  const hasAiCover = Boolean(
    card &&
    !isGeneratingAiImage &&
    !card.generatedImageIsFallback &&
    aiImageUrl
  );

  const isWorking = isLoading || isGeneratingAiImage || isRenderingImage;
  const labelClass = darkConsole ? "text-white/80" : "text-ink";
  const formClass = darkConsole
    ? "rounded-[22px] border border-white/10 bg-white/[0.06] p-5 md:p-6"
    : "rounded-[22px] border border-clay bg-card p-5 md:p-6";
  const panelClass = darkConsole
    ? "rounded-[22px] border border-white/10 bg-white/[0.06] p-5"
    : "rounded-[22px] border border-clay bg-card p-5";

  const selectVariant = darkConsole ? "dark" : "default";

  const showPreviewColumn = !embedded || Boolean(card) || isWorking;

  return (
    <section className={embedded ? "" : "relative py-24"} id={embedded ? undefined : "demo"}>
      <PaywallModal onClose={() => setShowPaywall(false)} open={showPaywall} />
      <div className={embedded ? undefined : "section-shell"}>
        <div className={embedded ? "grid gap-8" : "relative z-10 grid gap-8 xl:grid-cols-[0.82fr_1.18fr]"}>
          <form className={formClass} onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                  01 · Товар
                </p>
                <p className={`mt-2 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                  Фото, описание и категория будущей карточки.
                </p>
              </div>
              <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                <span>Фото товара</span>
                <div className={`rounded-[18px] border border-dashed p-4 ${darkConsole ? "border-white/20 bg-white/5" : "border-clay bg-paper"}`}>
                  <Input accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} type="file" />
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <ImageUp size={15} />
                    {imageFileName || "JPG или PNG, до 10 МБ"}
                  </div>
                  {imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-[14px] border border-clay">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Загруженное фото товара"
                        className="aspect-[4/5] max-h-56 w-full object-cover"
                        src={imageUrl}
                      />
                    </div>
                  ) : null}
                </div>
              </label>
              <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                Описание товара
                <Textarea
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Например: беспроводные наушники с шумоподавлением, чёрные, с кейсом"
                  rows={3}
                  value={description}
                />
              </label>
              <div className={`border-t pt-5 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                  02 · Площадка и стиль
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Категория
                  <Input
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder={effectiveCategory || "Электроника"}
                    value={category}
                  />
                </label>
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Маркетплейс
                  <Select
                    onChange={(event) => {
                      const nextMarketplace = event.target.value;
                      setMarketplace(nextMarketplace);
                      reachGoal("select_marketplace", { marketplace: nextMarketplace });
                    }}
                    value={marketplace}
                    variant={selectVariant}
                  >
                    {marketplaces.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Стиль
                  <Select onChange={(event) => setStyle(event.target.value)} value={style} variant={selectVariant}>
                    {styles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </label>
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Режим изображения
                  <Select
                    onChange={(event) => setImageMode(event.target.value as ImageGenerationMode)}
                    value={imageMode}
                    variant={selectVariant}
                  >
                    {imageModes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <Checkbox
                checked={removeBackground}
                label="Убрать фон с фото"
                onChange={(event) => setRemoveBackground(event.target.checked)}
              />
              <div className={`rounded-[18px] border p-4 ${darkConsole ? "border-white/10 bg-white/5" : "border-clay bg-paper"}`}>
                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Количество карточек
                    <Select
                      onChange={(event) => setCardsCount(Number(event.target.value) as CardSeriesCount)}
                      value={cardsCount}
                      variant={selectVariant}
                    >
                      {cardCountOptions.map((count) => (
                        <option key={count} value={count}>
                          {`${count} ${getCardPlural(count)}`}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div>
                    <p className={`text-sm font-semibold ${labelClass}`}>Серия карточек товара</p>
                    <p className={`mt-2 text-sm leading-6 ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      При выборе нескольких карточек сервис создаст полноценную галерею товара: обложку,
                      преимущества, характеристики, применение и другие смысловые блоки.
                    </p>
                    {selectedCountExceedsQuota ? (
                      <p className="mt-2 text-sm font-semibold text-red-400">
                        Для серии нужно {cardsCount} генераций. Доступно сейчас: {remainingGenerations}. Купите пакет или
                        выберите меньше карточек.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className={`mt-4 rounded-[14px] border p-3 ${darkConsole ? "border-white/10 bg-black/10" : "border-clay bg-card"}`}>
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                    Состав серии
                  </p>
                  <ol className={`mt-3 grid gap-2 text-sm ${darkConsole ? "text-white/70" : "text-muted"}`}>
                    {seriesPlan.map((item) => (
                      <li className="grid grid-cols-[2rem_1fr] gap-2" key={`${item.index}-${item.type}`}>
                        <span className="font-black text-accent">{item.index}.</span>
                        <span>
                          <span className={darkConsole ? "font-semibold text-white" : "font-semibold text-ink"}>{item.title}</span>
                          <span className="block text-xs">{item.goal}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className={`rounded-[18px] border p-4 ${darkConsole ? "border-white/10 bg-white/5" : "border-clay bg-paper"}`}>
                <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                  03 · Площадка и текст карточки
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Режим текста
                    <Select
                      onChange={(event) => setTextMode(event.target.value as MarketplaceTextMode)}
                      value={textMode}
                      variant={selectVariant}
                    >
                      {textModes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Бренд
                    <Input onChange={(event) => setBrand(event.target.value)} placeholder="Например: Xiaomi" value={brand} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Артикул продавца
                    <Input onChange={(event) => setSellerSku(event.target.value)} placeholder="SKU-12345" value={sellerSku} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Цвет
                    <Input onChange={(event) => setColor(event.target.value)} placeholder="чёрный" value={color} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Размер
                    <Input onChange={(event) => setSize(event.target.value)} placeholder="M / 42" value={size} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Материал
                    <Input onChange={(event) => setMaterial(event.target.value)} placeholder="хлопок" value={material} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Габариты
                    <Input onChange={(event) => setDimensions(event.target.value)} placeholder="20×15×8 см" value={dimensions} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Вес
                    <Input onChange={(event) => setWeight(event.target.value)} placeholder="350 г" value={weight} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Комплектация
                    <Input
                      onChange={(event) => setPackageContents(event.target.value)}
                      placeholder="кабель, чехол"
                      value={packageContents}
                    />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Целевая аудитория
                    <Input
                      onChange={(event) => setTargetAudience(event.target.value)}
                      placeholder="для офиса"
                      value={targetAudience}
                    />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Сценарий использования
                    <Input onChange={(event) => setUseCase(event.target.value)} placeholder="для поездок" value={useCase} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Старая цена
                    <Input onChange={(event) => setOldPrice(event.target.value)} placeholder="1 990 ₽" value={oldPrice} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Скидка
                    <Input onChange={(event) => setDiscount(event.target.value)} placeholder="-20%" value={discount} />
                  </label>
                </div>
              </div>
              <div className={`rounded-[18px] border p-4 ${darkConsole ? "border-white/10 bg-white/5" : "border-clay bg-paper"}`}>
                <p className={`text-xs font-black uppercase tracking-[0.18em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                  04 · Продажа
                </p>
                <h4 className={`mt-2 text-sm font-semibold ${labelClass}`}>Заголовок, цена и пресет для обложки</h4>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Заголовок
                    <Input
                      onChange={(event) => setHeadline(event.target.value)}
                      placeholder="ПРЕМИУМ-ТОВАР"
                      value={headline}
                    />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Цена
                    <Input onChange={(event) => setPrice(event.target.value)} placeholder="7 490 ₽" value={price} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    CTA
                    <Input
                      onChange={(event) => setCtaText(event.target.value)}
                      placeholder="ДОБАВИТЬ В КОРЗИНУ"
                      value={ctaText}
                    />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Пресет дизайна
                    <Select
                      onChange={(event) => {
                        const nextDesignPreset = event.target.value as ImageDesignPreset;
                        setDesignPreset(nextDesignPreset);
                        reachGoal("select_design_preset", { designPreset: nextDesignPreset });
                      }}
                      value={designPreset}
                      variant={selectVariant}
                    >
                      {designPresets.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </div>
              {error ? <Alert variant="error">{error}</Alert> : null}
              {notice ? <Alert variant="success">{notice}</Alert> : null}
              {persistToServer && remainingGenerations !== null ? (
                <p className="text-sm font-semibold text-muted">
                  Доступно генераций: <span className="text-accent">{remainingGenerations}</span>
                </p>
              ) : null}
              {seriesProgress ? (
                <p className={`text-sm font-semibold ${darkConsole ? "text-mint" : "text-accent"}`}>
                  {seriesProgress}
                </p>
              ) : null}
              <div className={`flex flex-wrap gap-3 border-t pt-1 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <Button disabled={isWorking || (persistToServer && remainingGenerations === 0)} type="submit">
                  {isWorking ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                  {isWorking
                    ? cardsCount > 1
                      ? "Генерируем серию…"
                      : "Генерируем…"
                    : cardsCount > 1
                      ? `Сгенерировать ${cardsCount} карточек`
                      : "Сгенерировать карточку"}
                </Button>
                <Button onClick={handleClear} type="button" variant="secondary">
                  <RotateCcw size={17} />
                  Очистить
                </Button>
              </div>
            </div>
          </form>
          {showPreviewColumn ? (
          <div className="grid gap-6">
            {isWorking && !card ? (
              <div className={panelClass}>
                <p className={`mb-4 text-sm font-semibold ${darkConsole ? "text-white/70" : "text-muted"}`}>
                  {seriesProgress || "Подготавливаем карточку…"}
                </p>
                <SkeletonBlock className={`w-full ${embedded ? "h-48" : "aspect-[4/5]"}`} />
              </div>
            ) : null}
            {card ? (
              <div className={panelClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className={`flex items-center gap-2 text-lg font-bold ${darkConsole ? "text-white" : "text-ink"}`}>
                      <FileImage size={20} />
                      Превью обложки
                    </h3>
                    <p className={`mt-1 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      Готова к загрузке на {card.marketplace}
                    </p>
                  </div>
                  <Button onClick={handleDownloadBestImage} variant="dark">
                    Скачать PNG
                  </Button>
                </div>
                {card.generatedImageIsFallback && card.generatedImageError ? (
                  <div className="mt-4">
                    <Alert variant="error">
                      NanoBanana не вернул AI-изображение: {card.generatedImageError}. Ниже показан fallback-preview.
                    </Alert>
                  </div>
                ) : null}
                <div className={`mt-4 overflow-hidden rounded-card border ${darkConsole ? "border-white/10 bg-ink-soft" : "border-clay bg-paper"}`}>
                  {isGeneratingAiImage ? (
                    <div className="grid aspect-[4/5] place-items-center gap-4 px-6">
                      <Loader2 className="animate-spin text-muted" size={28} />
                      <p className="text-center text-sm font-medium text-muted">Создаём обложку…</p>
                    </div>
                  ) : hasAiCover && aiImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Готовая обложка"
                      className="aspect-[4/5] w-full object-cover"
                      src={aiImageUrl}
                    />
                  ) : isRenderingImage ? (
                    <div className="grid aspect-[4/5] place-items-center">
                      <SkeletonBlock className="h-full w-full rounded-none" />
                    </div>
                  ) : (
                    <GeneratedCardPreview
                      card={card}
                      generatedImageUrl={card.generatedImageUrl || card.generatedImageDataUrl}
                      imageUrl={imageUrl || card.imageDataUrl}
                      ref={previewRef}
                      styleName={style}
                    />
                  )}
                </div>
              </div>
            ) : !isWorking && !embedded ? (
              <div className={`${panelClass} grid aspect-[4/5] place-items-center text-center`}>
                <div>
                  <p className={`text-sm font-semibold ${darkConsole ? "text-white/70" : "text-muted"}`}>
                    Live preview
                  </p>
                  <p className={`mt-2 text-sm ${darkConsole ? "text-white/45" : "text-muted/80"}`}>
                    Загрузите фото и нажмите «Сгенерировать карточку»
                  </p>
                </div>
              </div>
            ) : null}
            {seriesCards.length > 1 ? (
              <div className={panelClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className={`text-lg font-bold ${darkConsole ? "text-white" : "text-ink"}`}>
                      Галерея серии
                    </h3>
                    <p className={`mt-1 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      {seriesCards.length} карточек одного товара с разными смысловыми блоками.
                    </p>
                  </div>
                  <Button onClick={handleDownloadSeriesZip} size="sm" variant="dark">
                    <Archive size={16} />
                    Скачать ZIP
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {seriesCards.map((seriesCard, index) => {
                    const previewUrl = getGeneratedCardImageUrl(seriesCard);
                    const itemError = seriesCard.generatedImageError;

                    return (
                      <div
                        className={`rounded-[16px] border p-3 ${darkConsole ? "border-white/10 bg-black/10" : "border-clay bg-paper"}`}
                        key={seriesCard.id}
                      >
                        <button className="block w-full text-left" onClick={() => setCard(seriesCard)} type="button">
                          <div className={`overflow-hidden rounded-[12px] border ${darkConsole ? "border-white/10" : "border-clay"}`}>
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={seriesCard.title}
                                className="aspect-[4/5] w-full object-cover"
                                src={previewUrl}
                              />
                            ) : (
                              <div className="grid aspect-[4/5] place-items-center px-4 text-center text-sm font-semibold text-muted">
                                {itemError ? "Не удалось сгенерировать" : "Карточка готовится"}
                              </div>
                            )}
                          </div>
                          <p className={`mt-3 text-xs font-black uppercase tracking-[0.16em] ${darkConsole ? "text-mint" : "text-accent"}`}>
                            {String(seriesCard.seriesIndex ?? index + 1).padStart(2, "0")} · {seriesCard.seriesPlanItem?.title || "Карточка"}
                          </p>
                          <p className={`mt-1 line-clamp-2 text-sm font-semibold ${darkConsole ? "text-white" : "text-ink"}`}>
                            {seriesCard.title}
                          </p>
                          {itemError ? <p className="mt-2 text-xs font-semibold text-red-400">{itemError}</p> : null}
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button onClick={() => handleDownloadSeriesCard(seriesCard, index)} size="sm" variant="secondary">
                            <Download size={15} />
                            PNG
                          </Button>
                          <Button onClick={() => handleRetrySeriesCard(seriesCard)} size="sm" variant="ghost">
                            <RefreshCcw size={15} />
                            Повторить
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <ResultPanel card={card} dark={darkConsole} onDownloadPng={() => downloadPreviewPng(previewRef.current, card?.title)} onSave={handleSave} previewRef={previewRef} />
          </div>
          ) : null}
        </div>
        {!hideHistory ? (
          <div className="mt-8">
            <HistorySection
              history={history}
              onClear={() => {
                clearHistory();
                setHistory([]);
              }}
              onOpen={handleOpenHistory}
              onRemove={(id) => setHistory(removeFromHistory(id))}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getCardPlural(count: number) {
  if (count === 1) return "карточка";
  if (count > 1 && count < 5) return "карточки";
  return "карточек";
}

function buildCardSeriesPlan({
  count,
  category,
  marketplace,
  style,
  productDescription,
  headline
}: {
  count: CardSeriesCount;
  category: string;
  marketplace: string;
  style: string;
  productDescription: string;
  headline: string;
}): CardSeriesPlanItem[] {
  const typeOrder = getSeriesTypeOrder(count, category);
  const productName = cleanProductName(headline || productDescription);

  return typeOrder.map((type, index) => {
    const definition = getSeriesDefinition(type, productName, marketplace, style);

    return {
      index: index + 1,
      type,
      ...definition
    };
  });
}

function getSeriesTypeOrder(count: CardSeriesCount, category: string) {
  const normalizedCategory = category.toLowerCase();
  const base: Record<CardSeriesCount, string[]> = {
    1: ["hero"],
    3: ["hero", "benefits", "features"],
    5: ["hero", "benefits", "features", "how_to_use", "safety"],
    7: ["hero", "benefits", "features", "how_to_use", "safety", "compatibility", "assortment"],
    10: [
      "hero",
      "benefits",
      "features",
      "ingredients",
      "how_to_use",
      "use_cases",
      "safety",
      "compatibility",
      "assortment",
      "final_cta"
    ]
  };

  if (/космет|крем|сыворот|уход|шампун|маск/.test(normalizedCategory) && count === 10) {
    return ["hero", "benefits", "ingredients", "how_to_use", "texture", "skin_type", "safety", "use_cases", "assortment", "final_cta"];
  }

  if (/живот|кош|собак|питом/.test(normalizedCategory) && count >= 7) {
    return base[count].map((type) => (type === "compatibility" ? "hygiene" : type));
  }

  if (/электрон|гаджет|науш|телефон|техник/.test(normalizedCategory) && count === 10) {
    return ["hero", "key_specs", "benefits", "use_cases", "comparison", "compatibility", "package", "warranty", "dimensions", "final_cta"];
  }

  if (/одеж|плать|брюк|футбол|кофт|обув/.test(normalizedCategory) && count === 10) {
    return ["hero", "material", "fit", "sizes", "styling", "details", "care", "colors", "review", "final_cta"];
  }

  return base[count];
}

function getSeriesDefinition(
  type: string,
  productName: string,
  marketplace: string,
  style: string
): Omit<CardSeriesPlanItem, "index" | "type"> {
  const definitions: Record<string, Omit<CardSeriesPlanItem, "index" | "type">> = {
    hero: {
      title: "Главная обложка",
      goal: "Быстро объяснить, что это за товар и почему его стоит открыть.",
      mainHeadline: productName,
      subheadline: `Продающая обложка для ${marketplace}`,
      bullets: ["Крупный товар", "Понятный первый экран", "Акцент на главной выгоде"],
      badges: ["Хит для каталога", style],
      visualIdea: "Крупное фото товара, чистый фон, один сильный заголовок и 2-3 аккуратные плашки",
      textDensity: "medium"
    },
    benefits: {
      title: "Преимущества",
      goal: "Показать покупателю главные выгоды без повторения обложки.",
      mainHeadline: "Главные преимущества",
      subheadline: "Почему товар удобно выбрать",
      bullets: ["Понятная польза", "Удобство в использовании", "Подходит для ежедневных задач"],
      badges: ["Польза", "Комфорт"],
      visualIdea: "Товар в центре, вокруг крупные иконки преимуществ и короткие подписи",
      textDensity: "medium"
    },
    features: {
      title: "Характеристики",
      goal: "Собрать важные свойства товара в читаемый блок.",
      mainHeadline: "Характеристики без лишнего",
      subheadline: "Ключевые параметры в одном кадре",
      bullets: ["Материал / состав", "Размер / формат", "Комплектация"],
      badges: ["Параметры", "Детали"],
      visualIdea: "Структурная карточка с товаром сбоку и блоком характеристик крупным текстом",
      textDensity: "high"
    },
    ingredients: {
      title: "Состав / материалы",
      goal: "Показать состав, материалы или комплектацию без неподтвержденных обещаний.",
      mainHeadline: "Состав и детали",
      subheadline: "Что важно знать перед покупкой",
      bullets: ["Материалы", "Комплектация", "Особенности"],
      badges: ["Состав", "Детали"],
      visualIdea: "Крупный товар, рядом аккуратные карточки материалов или элементов комплекта",
      textDensity: "medium"
    },
    how_to_use: {
      title: "Применение",
      goal: "Показать, как пользоваться товаром или в каком сценарии он нужен.",
      mainHeadline: "Как использовать",
      subheadline: "Простой сценарий для покупателя",
      bullets: ["Шаг 1", "Шаг 2", "Готовый результат"],
      badges: ["Инструкция", "Просто"],
      visualIdea: "Пошаговая композиция с крупными цифрами и товаром в действии",
      textDensity: "medium"
    },
    use_cases: {
      title: "Сценарии использования",
      goal: "Показать несколько ситуаций, где товар может быть полезен.",
      mainHeadline: "Для разных задач",
      subheadline: "Сценарии использования",
      bullets: ["Дом", "Работа", "Подарок"],
      badges: ["Сценарии", "Универсально"],
      visualIdea: "Три аккуратных мини-сцены вокруг главного товара",
      textDensity: "medium"
    },
    safety: {
      title: "Доверие / безопасность",
      goal: "Дать спокойный аргумент качества без фейковых сертификатов и гарантий.",
      mainHeadline: "Качество без лишних обещаний",
      subheadline: "Понятные факты перед покупкой",
      bullets: ["Материалы и уход", "Комплектация без сюрпризов", "Подходит для ежедневного использования"],
      badges: ["Доверие", "Качество"],
      visualIdea: "Чистая премиальная карточка с товаром, отметками качества и спокойной палитрой",
      textDensity: "low"
    },
    compatibility: {
      title: "Кому подходит",
      goal: "Показать совместимость, аудиторию или ситуации выбора.",
      mainHeadline: "Кому подойдет",
      subheadline: "Быстрый ответ перед покупкой",
      bullets: ["Для выбранной категории", "Для повседневного использования", "Для подарка"],
      badges: ["Совместимость", "Выбор"],
      visualIdea: "Товар в центре, рядом 3 портретных или ситуационных блока без лишних деталей",
      textDensity: "medium"
    },
    assortment: {
      title: "Ассортимент / варианты",
      goal: "Показать варианты цвета, размера, объема или финальный аргумент серии.",
      mainHeadline: "Выберите свой вариант",
      subheadline: "Цвет, размер или формат под вашу задачу",
      bullets: ["Цвет", "Размер", "Формат"],
      badges: ["Варианты", "Ассортимент"],
      visualIdea: "Единая композиция с несколькими вариантами товара или аккуратными свотчами",
      textDensity: "medium"
    },
    final_cta: {
      title: "Финальная карточка",
      goal: "Закрыть галерею мягким аргументом покупки без агрессивного CTA.",
      mainHeadline: "Готово для вашего заказа",
      subheadline: "Финальный акцент серии",
      bullets: ["Сравните параметры", "Выберите подходящий вариант", "Добавьте в корзину"],
      badges: ["Финал", "Выбор"],
      visualIdea: "Премиальная финальная карточка с товаром, благодарностью и спокойным завершающим блоком",
      textDensity: "low"
    }
  };

  return definitions[type] ?? {
    title: "Смысловой блок",
    goal: "Раскрыть товар с новой стороны.",
    mainHeadline: "Новый аргумент",
    subheadline: "Отдельный блок серии",
    bullets: ["Польза", "Детали", "Выбор"],
    badges: ["Серия", style],
    visualIdea: "Единая карточка серии с товаром и одним главным сообщением",
    textDensity: "medium"
  };
}

function buildSeriesStyleGuide(style: string, marketplace: string) {
  return `${style} e-commerce стиль для ${marketplace}: единая палитра, крупная русская типографика, похожие плашки, аккуратные отступы, премиальная карточка 4:5.`;
}

function buildSeriesCardDescription(
  payload: ProductCardInput,
  planItem: CardSeriesPlanItem,
  seriesCount: CardSeriesCount
) {
  return `${payload.productDescription}

Сделай карточку серии ${planItem.index} из ${seriesCount}.
Тип блока: ${planItem.type}.
Название блока: ${planItem.title}.
Цель: ${planItem.goal}.
Главный заголовок: ${planItem.mainHeadline}.
Подзаголовок: ${planItem.subheadline}.
Тезисы: ${planItem.bullets.join("; ")}.
Бейджи: ${planItem.badges.join("; ")}.
Визуальная идея: ${planItem.visualIdea}.
Важно: не повторяй смысл других карточек серии, не придумывай неподтвержденные свойства, пиши коротко и на русском.`;
}

function buildSeriesInfographicTexts(planItem: CardSeriesPlanItem) {
  return [planItem.mainHeadline, ...planItem.badges, ...planItem.bullets].filter(Boolean).slice(0, 4);
}

function buildFailedSeriesCard(
  payload: ProductCardInput,
  planItem: CardSeriesPlanItem,
  seriesId: string,
  seriesCount: CardSeriesCount,
  imageDataUrl: string,
  error: string
): ProductCardResult {
  return {
    id: crypto.randomUUID(),
    title: planItem.mainHeadline,
    shortDescription: planItem.subheadline,
    fullDescription: planItem.goal,
    benefits: planItem.bullets,
    characteristics: [],
    keywords: [],
    infographicTexts: buildSeriesInfographicTexts(planItem),
    marketplaceTips: [],
    visualConcept: planItem.visualIdea,
    category: payload.category || "",
    marketplace: payload.marketplace,
    style: payload.style,
    generatedAt: new Date().toISOString(),
    provider: "Series plan",
    isFallback: true,
    imageDataUrl,
    generatedImageIsFallback: true,
    generatedImageError: error,
    platform: payload.platform,
    textMode: payload.textMode,
    sourceInput: {
      ...payload,
      cardsCount: seriesCount,
      seriesIndex: planItem.index,
      seriesType: planItem.type
    },
    seriesId,
    seriesIndex: planItem.index,
    seriesCount,
    seriesPlanItem: planItem,
    seriesStyleGuide: buildSeriesStyleGuide(payload.style, payload.marketplace)
  };
}

function hasGeneratedImage(card: ProductCardResult) {
  return Boolean(card.generatedImageBase64 || card.generatedImageUrl || card.generatedImageDataUrl || card.imageDataUrl);
}

function getGeneratedCardImageUrl(card: ProductCardResult) {
  if (card.generatedImageUrl) return card.generatedImageUrl;
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType);
  }
  return card.generatedImageDataUrl || null;
}

async function downloadCardImage(card: ProductCardResult, fileName: string) {
  if (card.generatedImageUrl) {
    await downloadImageFromUrl(card.generatedImageUrl, fileName);
    return;
  }

  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    downloadBase64Image(card.generatedImageBase64, card.generatedImageMimeType, fileName);
    return;
  }

  if (card.generatedImageDataUrl) {
    await downloadImageFromUrl(card.generatedImageDataUrl, fileName);
  }
}

async function getCardImageBlob(card: ProductCardResult) {
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToBlob(card.generatedImageBase64, card.generatedImageMimeType);
  }

  if (card.generatedImageDataUrl) {
    const image = dataUrlToBase64(card.generatedImageDataUrl);
    return base64ToBlob(image.base64, image.mimeType);
  }

  if (card.generatedImageUrl) {
    try {
      const response = await fetch(card.generatedImageUrl);
      if (!response.ok) return null;
      return response.blob();
    } catch {
      return null;
    }
  }

  return null;
}

function triggerBrowserDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function createZipBlob(files: { name: string; blob: Blob }[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);
    const { time, date } = getDosDateTime(new Date());
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(time),
      uint16(date),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes
    ]);

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(time),
      uint16(date),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes
    ]);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralSize),
    uint32(offset),
    uint16(0)
  ]);

  return new Blob([...localParts, ...centralParts, end].map(toBlobPart), { type: "application/zip" });
}

function toBlobPart(part: Uint8Array) {
  return part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer;
}

function getDosDateTime(value: Date) {
  return {
    time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2),
    date: ((value.getFullYear() - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate()
  };
}

function uint16(value: number) {
  const bytes = new Uint8Array(2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, value, true);
  return bytes;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function crc32(data: Uint8Array) {
  let crc = -1;

  for (const byte of data) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xff];
  }

  return (crc ^ -1) >>> 0;
}

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }

  return crc >>> 0;
});

function cleanProductName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Карточка товара";
  return trimmed.split(/[.,;\n]/)[0]?.slice(0, 48) || "Карточка товара";
}

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function resizeImageToDataUrl(file: File, maxSize = 1400) {
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

async function downloadGeneratedImage(dataUrl: string, title: string, fallbackNode: HTMLElement | null) {
  if (!dataUrl) {
    await downloadPreviewPng(fallbackNode, title);
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  const extension = dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png";
  link.download = `${title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "marketcard-ai"}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function downloadBestImage(card: ProductCardResult, renderedDataUrl: string, fallbackNode: HTMLElement | null) {
  if (card.generatedImageUrl) {
    await downloadImageFromUrl(card.generatedImageUrl, "marketcard-ai.png");
    return;
  }

  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    downloadBase64Image(card.generatedImageBase64, card.generatedImageMimeType, "marketcard-ai.png");
    return;
  }

  await downloadGeneratedImage(renderedDataUrl, card.title, fallbackNode);
}
