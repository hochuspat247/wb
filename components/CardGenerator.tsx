"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Download, FileImage, ImageUp, Loader2, Pencil, RefreshCcw, RotateCcw, Star, Wand2, X } from "lucide-react";
import { CardEditPanel } from "@/components/CardEditPanel";
import { GeneratedCardPreview } from "@/components/GeneratedCardPreview";
import { HistorySection } from "@/components/HistorySection";
import { PaywallModal } from "@/components/PaywallModal";
import { trackConversion } from "@/components/analytics/AnalyticsTracker";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { ResultPanel } from "@/components/ResultPanel";
import { VideoFromCardFlow } from "@/components/video/VideoFromCardFlow";
import { SeriesTypePicker } from "@/components/SeriesTypePicker";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { SkeletonBlock } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { getImageSettings } from "@/lib/imageSettings";
import { resolveCategory } from "@/lib/category";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import { createPreviewPngDataUrl, downloadPreviewPng } from "@/lib/download";
import { downloadCardImageAsset } from "@/lib/client/cardImage";
import {
  base64ToBlob,
  base64ToDataUrl,
  dataUrlToBase64,
  downloadBase64Image,
  downloadImageFromUrl,
  getGeneratedCoverSrc,
  hasGeneratedAiCover,
  validateImageFile
} from "@/lib/image";
import { clearHistory, getHistory, removeFromHistory, saveToHistory } from "@/lib/storage";
import { fetchUserQuota, saveUserCardRemote } from "@/lib/api/user";
import { DEMO_GENERATION_ERROR, parseJsonResponse, toUserFacingError } from "@/lib/api/parseJsonResponse";
import { getOrCreateGuestId } from "@/lib/guest";
import { reachGoal } from "@/lib/metrika";
import { buildPreviousCardSnapshot } from "@/lib/series/editing";
import {
  buildCardSeriesPlanFromTypes,
  buildFailedSeriesCard,
  buildSeriesCardDescription,
  buildSeriesInfographicTexts,
  buildSeriesStyleGuide,
  getDefaultSeriesTypes
} from "@/lib/series/plan";
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
const DEMO_MIN_LOADING_MS = 20_000;
const DEMO_PROGRESS_DURATION_MS = 140_000;
const DEMO_LOADING_STATUSES = [
  "Загружаем фото",
  "Определяем товар",
  "Подбираем стиль и фон",
  "Формируем текст и акценты",
  "Собираем карточку",
  "Наносим демо-метку",
  "Проверяем результат",
  "Осталось чуть-чуть",
  "Делаем последние штрихи"
];

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

const GENERATE_BUTTON_CLASS =
  "relative overflow-hidden bg-[linear-gradient(135deg,#7cff6b_0%,#9bff8d_48%,#52f66a_100%)] text-ink ring-2 ring-accent/35 shadow-[0_0_0_5px_rgba(124,255,107,0.16),0_18px_46px_rgba(124,255,107,0.34)] hover:bg-[linear-gradient(135deg,#9bff8d_0%,#7cff6b_52%,#b9ff7a_100%)] hover:ring-accent/65 hover:shadow-[0_0_0_7px_rgba(124,255,107,0.22),0_22px_58px_rgba(124,255,107,0.44)] disabled:ring-accent/15 disabled:shadow-none";

function GenerationRatingPrompt({
  darkConsole,
  disabled,
  onDismiss,
  onRate
}: {
  darkConsole: boolean;
  disabled: boolean;
  onDismiss: () => void;
  onRate: (rating: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div
      className={`mt-4 rounded-[16px] border px-4 py-3 ${
        darkConsole ? "border-white/10 bg-white/[0.06]" : "border-clay bg-paper/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-bold ${darkConsole ? "text-white" : "text-ink"}`}>Оцените генерацию</p>
          <p className={`mt-0.5 text-xs ${darkConsole ? "text-white/55" : "text-muted"}`}>
            Это поможет улучшить результат. Можно просто закрыть.
          </p>
        </div>
        <button
          aria-label="Закрыть оценку"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
            darkConsole ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-card hover:text-ink"
          }`}
          disabled={disabled}
          onClick={onDismiss}
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex gap-1">
        {([1, 2, 3, 4, 5] as const).map((rating) => (
          <button
            aria-label={`Оценить на ${rating} из 5`}
            className={`grid h-9 w-9 place-items-center rounded-full transition hover:scale-105 ${
              darkConsole ? "hover:bg-white/10" : "hover:bg-card"
            }`}
            disabled={disabled}
            key={rating}
            onClick={() => onRate(rating)}
            type="button"
          >
            <Star className="fill-accent text-accent" size={21} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function CardGenerator({
  hideHistory = false,
  onSaved,
  onQuotaChange,
  embedded = false,
  persistToServer = false,
  darkConsole = false,
  compactDemoEntry = false,
  initialVideoOrderId = null,
  onVideoFlowReset
}: {
  hideHistory?: boolean;
  onSaved?: () => void;
  onQuotaChange?: (quota: { remaining: number; used: number; credits: number; unlimited?: boolean }) => void;
  embedded?: boolean;
  persistToServer?: boolean;
  darkConsole?: boolean;
  compactDemoEntry?: boolean;
  initialVideoOrderId?: string | null;
  onVideoFlowReset?: () => void;
}) {
  const router = useRouter();
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
  const [selectedSeriesTypes, setSelectedSeriesTypes] = useState<string[]>(["hero"]);
  const [editingCard, setEditingCard] = useState<ProductCardResult | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
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
  const [ratingPromptCardId, setRatingPromptCardId] = useState<string | null>(null);
  const [isSavingGenerationRating, setIsSavingGenerationRating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);
  const [demoStatusIndex, setDemoStatusIndex] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isDemoGenerating, setIsDemoGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const videoUpsellRef = useRef<HTMLDivElement>(null);
  const descriptionTrackedRef = useRef(false);
  const videoUpsellTrackedRef = useRef<string | null>(null);
  const [emphasizeVideoOffer, setEmphasizeVideoOffer] = useState(false);
  const [requestVideoConfig, setRequestVideoConfig] = useState(false);

  useEffect(() => {
    if (!persistToServer) return;

    fetchUserQuota()
      .then((quota) => {
        setRemainingGenerations(quota.remaining);
        setHasUnlimitedAccess(Boolean(quota.unlimited));
        onQuotaChange?.(quota);
      })
      .catch(() => setRemainingGenerations(null));
  }, [persistToServer, onQuotaChange]);

  useEffect(() => {
    if (!isDemoGenerating) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(95, Math.round((elapsed / DEMO_PROGRESS_DURATION_MS) * 95));
      const statusIndex = Math.min(
        DEMO_LOADING_STATUSES.length - 1,
        Math.floor(elapsed / (DEMO_PROGRESS_DURATION_MS / DEMO_LOADING_STATUSES.length))
      );

      setDemoProgress(progress);
      setDemoStatusIndex(statusIndex);
    }, 450);

    return () => window.clearInterval(timer);
  }, [isDemoGenerating]);

  const effectiveCategory = useMemo(
    () => resolveCategory({ description, category }),
    [category, description]
  );

  useEffect(() => {
    if (cardsCount === 1) {
      setSelectedSeriesTypes(["hero"]);
      return;
    }

    setSelectedSeriesTypes(getDefaultSeriesTypes(cardsCount, effectiveCategory));
  }, [cardsCount, effectiveCategory]);

  const plannedGenerationCount = cardsCount === 1 ? 1 : selectedSeriesTypes.length;
  const seriesPlan = useMemo(
    () =>
      buildCardSeriesPlanFromTypes(selectedSeriesTypes, {
        category: effectiveCategory,
        marketplace,
        style,
        productDescription: description,
        headline
      }),
    [selectedSeriesTypes, description, effectiveCategory, headline, marketplace, style]
  );
  const selectedCountExceedsQuota =
    persistToServer && remainingGenerations !== null && plannedGenerationCount > remainingGenerations;
  const showQuotaExceededWarning = selectedCountExceedsQuota && !isLoading;

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

    const cardHasAiCover = hasGeneratedAiCover(card);

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
        if (!cancelled && !isLoading) {
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
  }, [card, imageUrl, style, isLoading]);

  useEffect(() => {
    if (!persistToServer || !card || isGeneratingAiImage || isLoading) {
      return;
    }

    if (!hasGeneratedAiCover(card)) {
      return;
    }

    setEmphasizeVideoOffer(true);
    if (videoUpsellTrackedRef.current !== card.id) {
      videoUpsellTrackedRef.current = card.id;
      trackMarketingEvent("video_upsell_view", { source: "generation_complete" });
    }
  }, [card?.id, persistToServer, isGeneratingAiImage, isLoading, card]);

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
    trackMarketingEvent("photo_uploaded", {
      fileType: file.type,
      fileSize: file.size
    });
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);

    if (!descriptionTrackedRef.current && value.trim().length >= 3) {
      descriptionTrackedRef.current = true;
      trackMarketingEvent("description_filled");
    }
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
      seriesCount?: number;
      editInstructions?: string;
      preserveCard?: ProductCardResult;
    } = {}
  ) {
    const seriesCount = options.seriesCount ?? plannedGenerationCount;
    const previousCard = options.preserveCard ? buildPreviousCardSnapshot(options.preserveCard) : undefined;
    const requestPayload = options.planItem
      ? {
          ...payload,
          productDescription: buildSeriesCardDescription(payload, options.planItem, seriesCount),
          editInstructions: options.editInstructions,
          previousCard
        }
      : {
          ...payload,
          editInstructions: options.editInstructions,
          previousCard
        };

    const response = await fetch("/api/generate-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });
    const data = (await response.json()) as ProductCardResult & {
      error?: string;
      code?: string;
      quota?: { remaining: number; used: number; credits: number };
      imageGenerationTicket?: string;
    };

    if (!response.ok) {
      if (response.status === 402) {
        setRemainingGenerations(data.quota?.remaining ?? 0);
        if (data.quota) onQuotaChange?.(data.quota);
        setShowPaywall(true);
      }
      if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setNotice(data.error || "Подтвердите email, чтобы генерировать карточки.");
      }
      throw new Error(data.error || "Не удалось создать карточку. Попробуйте ещё раз.");
    }

    if (data.quota?.remaining !== undefined) {
      setRemainingGenerations(data.quota.remaining);
      onQuotaChange?.(data.quota);
    }

    const { quota: _quota, error: _error, imageGenerationTicket, ...cardPayload } = data;
    const planItem = options.planItem;
    const preserveCard = options.preserveCard;
    const { imageBase64: _imageBase64, imageMimeType: _imageMimeType, ...sourceInputPayload } = requestPayload;
    const generatedCard: ProductCardResult = {
      ...(cardPayload as ProductCardResult),
      id: preserveCard?.id || (cardPayload as ProductCardResult).id,
      title: planItem?.mainHeadline || (cardPayload as ProductCardResult).title,
      shortDescription: planItem?.subheadline || (cardPayload as ProductCardResult).shortDescription,
      benefits: planItem?.bullets?.length
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
      seriesId: options.seriesId ?? preserveCard?.seriesId,
      seriesIndex: planItem?.index ?? preserveCard?.seriesIndex,
      seriesCount: (options.seriesCount ?? preserveCard?.seriesCount ?? plannedGenerationCount) as CardSeriesCount,
      seriesPlanItem: planItem ?? preserveCard?.seriesPlanItem,
      seriesStyleGuide: options.seriesId || preserveCard?.seriesId ? buildSeriesStyleGuide(style, marketplace) : preserveCard?.seriesStyleGuide,
      sourceInput: {
        ...sourceInputPayload,
        headline: planItem?.mainHeadline || headline.trim() || undefined,
        price: price.trim() || undefined,
        ctaText: ctaText.trim() || undefined,
        designPreset,
        imageMode,
        removeBackground,
        cardsCount: (options.seriesCount ?? preserveCard?.seriesCount ?? plannedGenerationCount) as CardSeriesCount,
        seriesIndex: planItem?.index,
        seriesType: planItem?.type
      }
    };

    return {
      card: generatedCard,
      quota: data.quota,
      imageGenerationTicket
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSeriesProgress("");
    setEmphasizeVideoOffer(false);
    videoUpsellTrackedRef.current = null;

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
        `Для серии нужно ${plannedGenerationCount} генераций, а доступно ${remainingGenerations}. Уменьшите количество карточек или купите пакет.`
      );
      setShowPaywall(true);
      return;
    }

    if (removeBackground) {
      await handleBackgroundRemoval();
    }

    setIsLoading(true);
    setSeriesCards([]);
    setRatingPromptCardId(null);
    const imagePayload = imageUrl ? dataUrlToBase64(imageUrl) : null;
    const payload: ProductCardInput = {
      productDescription: description,
      category: effectiveCategory,
      marketplace,
      style,
      includeSeo: true,
      focusBenefits: true,
      includeInfographicText: true,
      imageFileName,
      imageBase64: imagePayload?.base64,
      imageMimeType: imagePayload?.mimeType,
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

    if (!persistToServer) {
      await handleDemoSubmit(payload);
      return;
    }

    try {
      if (cardsCount === 1) {
        const { card: generatedCard, quota, imageGenerationTicket } = await createGeneratedProductCard(payload);
        setCard(generatedCard);
        setNotice("Создаём обложку…");
        const finalCard = await generateAiMarketplaceImage(generatedCard, undefined, imageGenerationTicket);
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
      const seriesTotal = seriesPlan.length;

      for (const planItem of seriesPlan) {
        try {
          setSeriesProgress(`Генерируется карточка ${planItem.index} из ${seriesTotal}`);
          setNotice(`Генерируется карточка ${planItem.index} из ${seriesTotal}: ${planItem.title}`);
          const { card: generatedCard, imageGenerationTicket } = await createGeneratedProductCard(payload, {
            planItem,
            seriesId,
            seriesCount: seriesTotal
          });
          setCard(generatedCard);
          const finalCard = await generateAiMarketplaceImage(generatedCard, undefined, imageGenerationTicket);
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

          completedCards.push(buildFailedSeriesCard(payload, planItem, seriesId, seriesTotal, imageUrl, message));
          setSeriesCards([...completedCards]);
          setError(`Карточка ${planItem.index} не сгенерировалась: ${message}`);
        }
      }

      const readyCards = completedCards.filter((item) => item.provider !== "Series plan");

      if (readyCards.length) {
        setCard(readyCards[readyCards.length - 1]);
        setNotice(`Готово: создано ${readyCards.length} из ${seriesTotal} карточек серии.`);
        trackConversion("generation_complete", {
          marketplace,
          platform: payload.platform || "wildberries",
          cardsCount: seriesTotal
        });
        reachGoal("generate_card", {
          marketplace,
          designPreset,
          cardsCount: seriesTotal,
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

  async function handleDemoSubmit(payload: ProductCardInput) {
    const startedAt = Date.now();
    trackMarketingEvent("demo_generation_started", {
      marketplace,
      hasImage: Boolean(imageUrl)
    });
    setIsDemoGenerating(true);
    setIsLoading(true);
    setDemoProgress(0);
    setDemoStatusIndex(0);
    setCard(null);
    setSeriesCards([]);

    try {
      const image = dataUrlToBase64(imageUrl);
      const guestId = getOrCreateGuestId();
      const response = await fetch("/api/generations/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId,
          cardInput: {
            ...payload,
            cardsCount: 1
          },
          imageBase64: image.base64,
          imageMimeType: image.mimeType,
          imageProvider: getImageSettings().imageProvider,
          imageMode,
          headline: headline.trim() || undefined,
          price: price.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          designPreset
        })
      });
      const data = await parseJsonResponse<{ id?: string; error?: string }>(response);

      if (!response.ok || !data.id) {
        throw new Error(data.error || DEMO_GENERATION_ERROR);
      }

      const remainingDelay = Math.max(0, DEMO_MIN_LOADING_MS - (Date.now() - startedAt));
      await wait(remainingDelay);
      setDemoProgress(100);
      trackMarketingEvent("demo_generation_completed", {
        marketplace,
        generationId: data.id
      });
      router.push(`/generations/${data.id}?guestId=${encodeURIComponent(guestId)}`);
    } catch (caught) {
      const message = toUserFacingError(caught);
      setError(message);
      setIsDemoGenerating(false);
      setIsLoading(false);
      setDemoProgress(0);
      trackMarketingEvent("demo_generation_error", {
        message,
        source: "card_generator",
        marketplace
      });
    }
  }

  function handleClear() {
    setDescription("");
    descriptionTrackedRef.current = false;
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
    setSelectedSeriesTypes(["hero"]);
    setEditingCard(null);
    setEditInstructions("");
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
    setRatingPromptCardId(null);
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
      const savedCard = saved.find((item) => item.id === nextCard.id);
      if (savedCard) {
        setCard((current) => (current?.id === savedCard.id ? savedCard : current));
        setSeriesCards((items) => items.map((item) => (item.id === savedCard.id ? savedCard : item)));
      }
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

  async function updateGenerationRating(nextCard: ProductCardResult, options: { rating?: number; dismissed?: boolean }) {
    setCard(nextCard);
    setSeriesCards((items) => items.map((item) => (item.id === nextCard.id ? nextCard : item)));
    setRatingPromptCardId(null);
    setIsSavingGenerationRating(true);

    try {
      if (persistToServer) {
        const saved = await saveUserCardRemote(nextCard);
        setHistory(saved);
        onSaved?.();
      } else {
        setHistory(saveToHistory(nextCard));
      }

      if (options.rating) {
        reachGoal("generation_rating", { rating: options.rating });
        setNotice("Спасибо, оценка сохранена.");
      }
    } catch {
      setError("Не удалось сохранить оценку генерации.");
    } finally {
      setIsSavingGenerationRating(false);
    }
  }

  function handleRateGeneration(rating: 1 | 2 | 3 | 4 | 5) {
    if (!card) {
      return;
    }

    void updateGenerationRating(
      {
        ...card,
        generationRating: rating,
        generationRatedAt: new Date().toISOString(),
        generationRatingDismissedAt: undefined
      },
      { rating }
    );
  }

  function handleDismissGenerationRating() {
    if (!card) {
      return;
    }

    void updateGenerationRating(
      {
        ...card,
        generationRatingDismissedAt: new Date().toISOString()
      },
      { dismissed: true }
    );
  }

  function handleOpenHistory(cardFromHistory: ProductCardResult) {
    setCard(cardFromHistory);
    setRatingPromptCardId(null);
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
    trackConversion("download_png", {
      source: persistToServer ? "cabinet" : "local",
      series: Boolean(card.seriesId)
    });
    await downloadBestImage(card, renderedImageUrl, previewRef.current);

    if (card.watermarkLocked) {
      setNotice("Скачана версия с демо-меткой. Без водяного знака — первая карточка или после покупки пакета.");
    }

    if (persistToServer && hasGeneratedAiCover(card)) {
      setEmphasizeVideoOffer(true);
      trackMarketingEvent("video_upsell_view", { source: "png_download" });
      window.requestAnimationFrame(() => {
        videoUpsellRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  async function handleDownloadSeriesCard(seriesCard: ProductCardResult, index: number) {
    reachGoal("download_png", { source: "series", seriesIndex: seriesCard.seriesIndex ?? index + 1 });
    trackConversion("download_png", { source: "series", seriesIndex: seriesCard.seriesIndex ?? index + 1 });
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

  async function handleRegenerateCard(cardToEdit: ProductCardResult, instructions: string) {
    if (!instructions.trim()) {
      setError("Опишите, что нужно исправить.");
      return;
    }

    if (persistToServer && remainingGenerations === 0) {
      setShowPaywall(true);
      return;
    }

    const payload =
      cardToEdit.sourceInput ??
      ({
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
      } satisfies ProductCardInput);

    setError("");
    setNotice("Перегенерируем карточку (1 генерация)…");
    setIsLoading(true);

    try {
      const { card: generatedCard } = await createGeneratedProductCard(payload, {
        planItem: cardToEdit.seriesPlanItem,
        seriesId: cardToEdit.seriesId,
        seriesCount: cardToEdit.seriesCount ?? plannedGenerationCount,
        editInstructions: instructions.trim(),
        preserveCard: cardToEdit
      });
      setCard(generatedCard);
      const finalCard = await generateAiMarketplaceImage(generatedCard, instructions.trim());
      const readyCard = finalCard ?? generatedCard;

      setCard(readyCard);
      if (seriesCards.length) {
        setSeriesCards((items) => items.map((item) => (item.id === cardToEdit.id ? readyCard : item)));
      }
      await persistGeneratedCard(readyCard, { silent: true });
      setEditingCard(null);
      setEditInstructions("");
      setNotice("Карточка обновлена. Списана 1 генерация.");
      reachGoal("generate_card", {
        regenerate: true,
        series: Boolean(cardToEdit.seriesPlanItem),
        hasEditInstructions: true
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось перегенерировать карточку.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCardEditor(nextCard: ProductCardResult) {
    setCard(nextCard);
    setEditingCard(nextCard);
    setEditInstructions("");
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
    setNotice(`Повторяем карточку ${planItem.index} из ${cardToRetry.seriesCount ?? plannedGenerationCount}`);
    setIsLoading(true);

    try {
      const { card: generatedCard } = await createGeneratedProductCard(payload, {
        planItem,
        seriesId: cardToRetry.seriesId,
        seriesCount: cardToRetry.seriesCount ?? plannedGenerationCount,
        preserveCard: cardToRetry
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
    const hasUsableImage = hasRemoteImage || hasBase64Image;

    if (!hasUsableImage) {
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
        seed: data.seed,
        generationRating: undefined,
        generationRatedAt: undefined,
        generationRatingDismissedAt: undefined
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
      seed: data.seed,
      generationRating: undefined,
      generationRatedAt: undefined,
      generationRatingDismissedAt: undefined
    };
    setCard(updatedCard);
    setRatingPromptCardId(updatedCard.id);
    return updatedCard;
  }

  async function generateAiMarketplaceImage(
    cardForImage: ProductCardResult,
    editInstructions?: string,
    imageGenerationTicket?: string
  ): Promise<ProductCardResult | null> {
    const inSeriesBatch = Boolean(cardForImage.seriesCount && cardForImage.seriesCount > 1 && isLoading);
    const productImage = imageUrl || cardForImage.imageDataUrl;

    if (!productImage) {
      setNotice("Тексты готовы. Загрузите фото, чтобы создать обложку.");
      return cardForImage;
    }

    setIsGeneratingAiImage(true);

    try {
      const image = dataUrlToBase64(productImage);
      const baseCardInput =
        cardForImage.sourceInput ??
        ({
          productDescription: description,
          category: cardForImage.category,
          marketplace,
          style,
          includeSeo: true,
          focusBenefits: true,
          includeInfographicText: true
        } satisfies ProductCardInput);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: cardForImage.seriesPlanItem
            ? buildSeriesCardDescription(baseCardInput, cardForImage.seriesPlanItem, cardForImage.seriesCount ?? plannedGenerationCount)
            : baseCardInput.productDescription,
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
          imageGenerationTicket,
          seriesStyleGuide: cardForImage.seriesStyleGuide,
          seriesCardType: cardForImage.seriesPlanItem?.type,
          seriesCardGoal: cardForImage.seriesPlanItem?.goal,
          seriesCardVisualIdea: cardForImage.seriesPlanItem?.visualIdea,
          badges: cardForImage.seriesPlanItem?.badges,
          editInstructions: editInstructions?.trim() || undefined
        })
      });
      const data = (await response.json()) as GenerateImageResult & {
        error?: string;
        code?: string;
        quota?: { remaining: number; used: number; credits: number };
      };

      if (!response.ok) {
        if (response.status === 402) {
          setRemainingGenerations(data.quota?.remaining ?? 0);
          if (data.quota) onQuotaChange?.(data.quota);
          setShowPaywall(true);
        }
        if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
          setNotice(data.error || "Подтвердите email, чтобы генерировать карточки.");
        }
        throw new Error(data.error || "Не удалось создать обложку.");
      }

      if (data.quota?.remaining !== undefined) {
        setRemainingGenerations(data.quota.remaining);
        onQuotaChange?.(data.quota);
      }

      const updatedCard = applyImageResult(cardForImage, data);

      if (!hasUsableImage(data)) {
        if (!inSeriesBatch) {
          setNotice(
            data.error
              ? `NanoBanana не вернул AI-изображение: ${data.error}. Показан fallback-preview.`
              : "NanoBanana не вернул AI-изображение. Показан fallback-preview."
          );
        }
        return updatedCard;
      }

      if (!inSeriesBatch) {
        setNotice("Готово! Скачайте карточку и загрузите на маркетплейс.");
      }
      return updatedCard;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Неизвестная ошибка генерации изображения";
      if (!inSeriesBatch) {
        setNotice(`Текст готов, но AI-изображение не создалось: ${message}. Показан fallback-preview.`);
      }
      return cardForImage;
    } finally {
      setIsGeneratingAiImage(false);
    }
  }

  const aiImageUrl = card ? getGeneratedCoverSrc(card) : null;

  const hasAiCover = Boolean(card && !isGeneratingAiImage && hasGeneratedAiCover(card));
  const shouldShowGenerationRatingPrompt = Boolean(
    card &&
      hasAiCover &&
      ratingPromptCardId === card.id &&
      !card.generationRating &&
      !card.generationRatingDismissedAt
  );

  const isWorking = isLoading || isGeneratingAiImage || isRenderingImage || isDemoGenerating;
  const labelClass = darkConsole ? "text-white/80" : "text-ink";
  const formClass = darkConsole
    ? embedded
      ? "rounded-[18px] border border-white/10 bg-white/[0.06] p-3 sm:rounded-[22px] sm:p-5 md:p-6"
      : "rounded-[22px] border border-white/10 bg-white/[0.06] p-5 md:p-6"
    : compactDemoEntry
      ? "rounded-[24px] border border-clay bg-card p-5 shadow-soft md:p-7"
      : "rounded-[22px] border border-clay bg-card p-5 md:p-6";
  const panelClass = darkConsole
    ? embedded
      ? "rounded-[18px] border border-white/10 bg-white/[0.06] p-3 sm:rounded-[22px] sm:p-5"
      : "rounded-[22px] border border-white/10 bg-white/[0.06] p-5"
    : "rounded-[22px] border border-clay bg-card p-5";
  const sectionClass = embedded
    ? "min-w-0 max-w-full overflow-x-hidden"
    : compactDemoEntry
      ? "relative scroll-mt-24 pb-12 pt-2 md:pb-16"
      : "relative py-24";
  const shellClass = embedded ? undefined : compactDemoEntry ? "section-shell max-w-4xl" : "section-shell";

  const selectVariant = darkConsole ? "dark" : "default";

  const showPreviewColumn = !compactDemoEntry && (!embedded || Boolean(card) || isWorking);
  const embeddedLayoutClass =
    embedded || compactDemoEntry
      ? "grid min-w-0 gap-5 sm:gap-8"
      : "relative z-10 grid min-w-0 gap-8 xl:grid-cols-[0.82fr_1.18fr]";
  const previewColumnClass = embedded
    ? "grid min-w-0 gap-5 sm:gap-6"
    : "grid min-w-0 gap-5 sm:gap-6 lg:sticky lg:top-24";
  const previewFrameClass = embedded
    ? "mx-auto w-full max-w-sm"
    : "w-full";

  if (isDemoGenerating) {
    return (
      <section className={sectionClass} id={embedded ? undefined : "demo"}>
        <div className={shellClass}>
          <div className={formClass}>
            <div className="mx-auto max-w-2xl py-8 text-center md:py-16">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent">
                <Loader2 className="animate-spin" size={30} />
              </div>
              <h2 className={`text-3xl font-black md:text-5xl ${darkConsole ? "text-white" : "text-ink"}`}>
                Создаём вашу карточку
              </h2>
              <p className={`mt-4 text-base font-semibold ${darkConsole ? "text-white/55" : "text-muted"}`}>
                Обычно это занимает около минуты
              </p>
              <div className={`mt-8 overflow-hidden rounded-full ${darkConsole ? "bg-white/10" : "bg-ink/10"}`}>
                <div
                  className="h-3 rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm font-bold">
                <span className={darkConsole ? "text-white/70" : "text-muted"}>{DEMO_LOADING_STATUSES[demoStatusIndex]}</span>
                <span className={darkConsole ? "text-mint" : "text-accent"}>{demoProgress}%</span>
              </div>
              {error ? (
                <div className="mt-6">
                  <Alert variant="error">{error}</Alert>
                  <Button className="mt-4" onClick={() => setIsDemoGenerating(false)} type="button">
                    Попробовать снова
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass} id={embedded ? undefined : "demo"}>
      <PaywallModal
        onClose={() => setShowPaywall(false)}
        onCreateVideo={
          card && hasGeneratedAiCover(card)
            ? () => {
                setShowPaywall(false);
                setEmphasizeVideoOffer(true);
                setRequestVideoConfig(true);
                window.requestAnimationFrame(() => {
                  videoUpsellRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                });
              }
            : undefined
        }
        open={showPaywall}
      />
      <div className={shellClass}>
        <div className={embeddedLayoutClass}>
          <form className={`${formClass} min-w-0`} onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:gap-5">
              <div>
                <p className={`text-sm font-semibold ${labelClass}`}>
                  {compactDemoEntry ? "Попробуйте на своём товаре" : "Товар"}
                </p>
                <p className={`mt-1 text-sm ${darkConsole ? "text-white/45" : "text-muted"}`}>
                  {compactDemoEntry ? "Загрузите фото и добавьте короткое описание — демо запустится без входа." : "Фото и описание"}
                </p>
              </div>
              <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                <span>Фото товара</span>
                <div className={`rounded-[18px] border border-dashed p-4 ${darkConsole ? "border-white/20 bg-white/5" : "border-clay bg-paper"}`}>
                  <Input
                    accept="image/*"
                    onClick={() => trackMarketingEvent("photo_upload_started")}
                    onChange={(event) => handleImage(event.target.files?.[0])}
                    type="file"
                  />
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
                  onChange={(event) => handleDescriptionChange(event.target.value)}
                  placeholder="Например: беспроводные наушники с шумоподавлением, чёрные, с кейсом"
                  rows={3}
                  value={description}
                />
              </label>
              {!compactDemoEntry ? (
              <>
              {persistToServer ? (
              <div className={`border-t pt-5 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <p className={`text-sm font-semibold ${labelClass}`}>Площадка и стиль</p>
              </div>
              ) : null}
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
              <div className={`border-t pt-5 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Сколько карточек
                  <Select
                    onChange={(event) => setCardsCount(Number(event.target.value) as CardSeriesCount)}
                    value={cardsCount}
                    variant={selectVariant}
                  >
                    {cardCountOptions.map((count) => (
                      <option key={count} value={count}>
                        {count === 1 ? "1 карточка" : `${count} карточки`}
                      </option>
                    ))}
                  </Select>
                </label>
                {cardsCount > 1 ? (
                  <div className="mt-4 grid gap-3">
                    <p className={`text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      Выбрано <span className="font-semibold text-accent">{plannedGenerationCount}</span> — столько
                      генераций спишется
                    </p>
                    <SeriesTypePicker
                      category={effectiveCategory}
                      darkConsole={darkConsole}
                      marketplace={marketplace}
                      onChange={setSelectedSeriesTypes}
                      selectedTypes={selectedSeriesTypes}
                      style={style}
                    />
                  </div>
                ) : null}
                {showQuotaExceededWarning ? (
                  <p className="mt-3 text-sm text-red-400">
                    Нужно {plannedGenerationCount} генераций, доступно {remainingGenerations}
                  </p>
                ) : null}
              </div>
              <details
                className={`group rounded-[14px] border ${darkConsole ? "border-white/10 bg-white/[0.03]" : "border-clay bg-paper"}`}
              >
                <summary
                  className={`cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none ${labelClass}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    Дополнительно для текста
                    <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                      необязательно
                    </span>
                  </span>
                </summary>
                <div
                  className={`grid gap-4 border-t px-4 pb-4 pt-3 md:grid-cols-2 ${darkConsole ? "border-white/10" : "border-clay"}`}
                >
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
                    <Input onChange={(event) => setBrand(event.target.value)} placeholder="Xiaomi" value={brand} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Цвет
                    <Input onChange={(event) => setColor(event.target.value)} placeholder="чёрный" value={color} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Размер
                    <Input onChange={(event) => setSize(event.target.value)} placeholder="M" value={size} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Материал
                    <Input onChange={(event) => setMaterial(event.target.value)} placeholder="хлопок" value={material} />
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
                    Артикул
                    <Input onChange={(event) => setSellerSku(event.target.value)} placeholder="SKU-12345" value={sellerSku} />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Цена в тексте
                    <Input onChange={(event) => setPrice(event.target.value)} placeholder="7 490 ₽" value={price} />
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
                    Аудитория
                    <Input
                      onChange={(event) => setTargetAudience(event.target.value)}
                      placeholder="для офиса"
                      value={targetAudience}
                    />
                  </label>
                  <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                    Сценарий
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
                  <label className={`grid gap-2 text-sm font-semibold md:col-span-2 ${labelClass}`}>
                    CTA на обложке
                    <Input
                      onChange={(event) => setCtaText(event.target.value)}
                      placeholder="ДОБАВИТЬ В КОРЗИНУ"
                      value={ctaText}
                    />
                  </label>
                </div>
              </details>
              <div className={`grid gap-4 md:grid-cols-2 ${darkConsole ? "" : ""}`}>
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Заголовок на обложке
                  <Input
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="ПРЕМИУМ-ТОВАР"
                    value={headline}
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
              </>
              ) : null}
              {error ? <Alert variant="error">{error}</Alert> : null}
              {notice ? <Alert variant="success">{notice}</Alert> : null}
              {seriesProgress ? (
                <p className={`text-sm font-semibold ${darkConsole ? "text-mint" : "text-accent"}`}>
                  {seriesProgress}
                </p>
              ) : null}
              {persistToServer && remainingGenerations !== null && !isLoading ? (
                <p className="text-sm font-semibold text-muted">
                  Доступно генераций: <span className="text-accent">{remainingGenerations}</span>
                </p>
              ) : null}
              <div className={`flex flex-col gap-2 border-t pt-3 sm:flex-row sm:flex-wrap sm:gap-3 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <Button
                  className={`w-full sm:w-auto ${GENERATE_BUTTON_CLASS}`}
                  disabled={isWorking || (persistToServer && remainingGenerations === 0)}
                  type="submit"
                >
                  {isWorking ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                  {compactDemoEntry
                    ? isWorking
                      ? "Генерируем демо…"
                      : "Сгенерировать демо"
                    : isWorking
                    ? plannedGenerationCount > 1
                      ? "Генерируем серию…"
                      : "Генерируем…"
                    : plannedGenerationCount > 1
                      ? `Сгенерировать ${plannedGenerationCount} карточек`
                      : "Сгенерировать карточку"}
                </Button>
                {compactDemoEntry ? null : (
                <Button className="w-full sm:w-auto" onClick={handleClear} type="button" variant="secondary">
                  <RotateCcw size={17} />
                  Очистить
                </Button>
                )}
                {compactDemoEntry ? (
                  <div className="w-full rounded-[14px] border border-accent/20 bg-accent/10 px-3 py-2.5">
                    <p className="text-sm font-semibold leading-relaxed text-ink">
                      1 демо-карточка без входа. Хотите карусель из нескольких фото и карточек товара?
                    </p>
                    <a className="mt-1 inline-flex text-sm font-black text-accent underline-offset-4 hover:underline" href="/#pricing">
                      Перейти к тарифам и собрать серию
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </form>
          {showPreviewColumn ? (
          <div className={previewColumnClass}>
            {isWorking && !card ? (
              <div className={panelClass}>
                <p className={`mb-4 text-sm font-semibold ${darkConsole ? "text-white/70" : "text-muted"}`}>
                  {seriesProgress || "Подготавливаем карточку…"}
                </p>
                <SkeletonBlock className={`w-full ${embedded ? "mx-auto aspect-[4/5] max-w-sm" : "aspect-[4/5]"}`} />
              </div>
            ) : null}
            {card ? (
              <div className={`${panelClass} min-w-0`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className={`flex items-center gap-2 text-lg font-bold ${darkConsole ? "text-white" : "text-ink"}`}>
                      <FileImage size={20} />
                      Превью обложки
                    </h3>
                    <p className={`mt-1 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      Готова к загрузке на {card.marketplace}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                    <Button className="w-full sm:w-auto" onClick={handleDownloadBestImage} variant="dark">
                      Скачать PNG
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => openCardEditor(card)} type="button" variant="secondary">
                      <Pencil size={16} />
                      Редактировать
                    </Button>
                  </div>
                </div>
                {card.generatedImageIsFallback && card.generatedImageError ? (
                  <div className="mt-4">
                    <Alert variant="error">
                      NanoBanana не вернул AI-изображение: {card.generatedImageError}. Ниже показан fallback-preview.
                    </Alert>
                  </div>
                ) : null}
                <div className={`relative mt-4 overflow-hidden rounded-card border ${previewFrameClass} ${darkConsole ? "border-white/10 bg-ink-soft" : "border-clay bg-paper"}`}>
                  {isGeneratingAiImage ? (
                    <div className="grid aspect-[4/5] max-h-[360px] place-items-center gap-4 px-6">
                      <Loader2 className="animate-spin text-muted" size={28} />
                      <p className="text-center text-sm font-medium text-muted">Создаём обложку…</p>
                    </div>
                  ) : hasAiCover && aiImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Готовая обложка"
                      className={`aspect-[4/5] w-full ${embedded ? "object-contain" : "object-cover"}`}
                      src={aiImageUrl}
                    />
                  ) : isRenderingImage ? (
                    <div className="grid aspect-[4/5] max-h-[360px] place-items-center">
                      <SkeletonBlock className="h-full w-full rounded-none" />
                    </div>
                  ) : (
                    <GeneratedCardPreview
                      card={card}
                      compact={embedded}
                      imageUrl={imageUrl || card.imageDataUrl}
                      ref={previewRef}
                      styleName={style}
                    />
                  )}
                  {card.watermarkLocked ? <WatermarkOverlay /> : null}
                </div>
                {card.watermarkLocked ? (
                  <p className={`mt-3 text-sm font-semibold leading-relaxed ${darkConsole ? "text-white/55" : "text-muted"}`}>
                    Карточка с демо-меткой. Скачать без водяного знака можно для первой генерации или после покупки
                    пакета.
                  </p>
                ) : null}
                {shouldShowGenerationRatingPrompt ? (
                  <GenerationRatingPrompt
                    darkConsole={darkConsole}
                    disabled={isSavingGenerationRating}
                    onDismiss={handleDismissGenerationRating}
                    onRate={handleRateGeneration}
                  />
                ) : null}
                {persistToServer && card ? (
                  <div ref={videoUpsellRef}>
                    <VideoFromCardFlow
                      card={card}
                      compact={embedded}
                      darkConsole={darkConsole}
                      disabled={isWorking}
                      initialOrderId={initialVideoOrderId}
                      onConfigRequestHandled={() => setRequestVideoConfig(false)}
                      onFlowReset={onVideoFlowReset}
                      onVideoReady={onSaved}
                      openConfigRequest={requestVideoConfig}
                      prominent={emphasizeVideoOffer && hasAiCover}
                    />
                  </div>
                ) : null}
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
                        <button className="block w-full text-left" onClick={() => openCardEditor(seriesCard)} type="button">
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
                          <Button onClick={() => openCardEditor(seriesCard)} size="sm" variant="ghost">
                            <Pencil size={15} />
                            Редактировать
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
            {!embedded && card ? (
              <ResultPanel
                card={card}
                compact={embedded}
                dark={darkConsole}
                onDownloadPng={() => downloadPreviewPng(previewRef.current, card?.title)}
                onSave={handleSave}
                previewRef={previewRef}
              />
            ) : null}
          </div>
          ) : null}
          {embedded && showPreviewColumn && card ? (
            <ResultPanel
              card={card}
              compact={embedded}
              dark={darkConsole}
              onDownloadPng={() => downloadPreviewPng(previewRef.current, card?.title)}
              onSave={handleSave}
              previewRef={previewRef}
            />
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
        {editingCard ? (
          <CardEditPanel
            card={editingCard}
            darkConsole={darkConsole}
            editInstructions={editInstructions}
            isLoading={isLoading}
            onClose={() => {
              setEditingCard(null);
              setEditInstructions("");
            }}
            onEditInstructionsChange={setEditInstructions}
            onRegenerate={() => handleRegenerateCard(editingCard, editInstructions)}
            remainingGenerations={remainingGenerations}
          />
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

function hasUsableImage(data: GenerateImageResult) {
  return Boolean(data.imageUrl || (data.imageBase64 && data.mimeType));
}

function hasGeneratedImage(card: ProductCardResult) {
  return Boolean(card.generatedImageBase64 || card.generatedImageUrl || card.generatedImageDataUrl || card.imageDataUrl);
}

function getGeneratedCardImageUrl(card: ProductCardResult) {
  return getGeneratedCoverSrc(card);
}

async function downloadCardImage(card: ProductCardResult, fileName: string) {
  const result = await downloadCardImageAsset(card, fileName);
  if (!result.missing) {
    return;
  }

  if (card.generatedImageUrl) {
    await downloadImageFromUrl(card.generatedImageUrl, fileName);
  }
}

async function getCardImageBlob(card: ProductCardResult) {
  if (card.previewImageUrl || card.imageDownloadUrl) {
    const url = card.imageDownloadUrl || card.previewImageUrl;
    if (url) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          return response.blob();
        }
      } catch {
        return null;
      }
    }
  }

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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const remoteResult = await downloadCardImageAsset(card, "marketcard-ai.png");
  if (!remoteResult.missing) {
    return;
  }

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
