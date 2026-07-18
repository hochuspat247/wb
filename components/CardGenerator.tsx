"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Download, FileImage, ImageUp, Loader2, Pencil, RefreshCcw, RotateCcw, Star, WifiOff, Wand2, X } from "lucide-react";
import { NanoBananaRetentionNotice } from "@/components/NanoBananaRetentionNotice";
import { CardEditPanel } from "@/components/CardEditPanel";
import { GeneratedCoverPreview } from "@/components/GeneratedCoverPreview";
import { GeneratedCardPreview } from "@/components/GeneratedCardPreview";
import { HistorySection } from "@/components/HistorySection";
import { KitOfferBanner } from "@/components/KitOfferBanner";
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
import {
  getSimilarCardTitle,
  resolveSimilarCardDescription,
  resolveSimilarCardPhoto,
  buildSimilarLayoutInstructions
} from "@/lib/client/similarCardSeed";
import {
  KIT_SERIES_DESCRIPTION,
  KIT_UNLOCK_CTA,
  SKU_KIT_SLIDE_COUNT,
  describeFreeQuotaMarketing,
  formatMonthlyFreeResetHint
} from "@/lib/pricing";
import {
  CARD_DESIGN_PRESETS,
  CARD_MARKETPLACES,
  CARD_SERIES_COUNTS,
  CARD_STYLES,
  CARD_TEXT_MODES,
  NANO_BANANA_ASPECT_RATIO,
  NANO_BANANA_IMAGE_MODEL,
  NANO_BANANA_OUTPUT_FORMAT,
  NANO_BANANA_RESOLUTION,
  normalizeCardStyle,
  normalizeCardsCount,
  normalizeDesignPreset,
  normalizeMarketplaceLabel,
  normalizeProductCardInput,
  normalizeTextMode,
  resolveNanoBananaImageProvider
} from "@/lib/marketplace/cardFormValidation";
import {
  extractProviderGenerationId,
  getImageGenerationRetryMessage,
  IMAGE_GENERATION_RETRY_MESSAGE
} from "@/lib/ai/imageGenerationErrors";
import { resolveCategory } from "@/lib/category";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";
import { createPreviewPngDataUrl, downloadPreviewPng } from "@/lib/download";
import { downloadCardImageAsset } from "@/lib/client/cardImage";
import { applyDownloadPolicyToCard, canDownloadCardImage, type DownloadPolicy } from "@/lib/client/watermarkPolicy";
import {
  base64ToBlob,
  base64ToDataUrl,
  dataUrlToBase64,
  downloadBase64Image,
  downloadImageFromUrl,
  hasGeneratedAiCover,
  validateImageFile
} from "@/lib/image";
import { clearHistory, getHistory, removeFromHistory, saveToHistory } from "@/lib/storage";
import { fetchUserQuota, saveUserCardRemote } from "@/lib/api/user";
import { DEMO_GENERATION_ERROR, parseJsonResponse, toUserFacingError } from "@/lib/api/parseJsonResponse";
import { getOrCreateGuestId } from "@/lib/guest";
import { fetchLatestGuestDemoId } from "@/lib/hero/submitHeroDemo";
import { reachGoal } from "@/lib/metrika";
import { buildPreviousCardSnapshot } from "@/lib/series/editing";
import {
  buildCardSeriesPlanFromTypes,
  buildFailedSeriesCard,
  buildSeriesCardDescription,
  buildSeriesEditInstructions,
  buildSeriesStyleGuide,
  getDefaultSeriesTypes,
  isMetaMarketplaceVisibleText
} from "@/lib/series/plan";
import type {
  GenerateImageResult,
  CardSeriesCount,
  CardSeriesPlanItem,
  ImageDesignPreset,
  ProductCardInput,
  ProductCardResult
} from "@/types/product-card";

const cardCountOptions = CARD_SERIES_COUNTS;

function getRequiredGenerationsForCardsCount(count: CardSeriesCount, category: string) {
  if (count === 1) {
    return 1;
  }

  return getDefaultSeriesTypes(count, category).length;
}

function isCardCountOptionLocked(
  count: CardSeriesCount,
  remaining: number | null,
  persistToServer: boolean,
  category: string,
  seriesUnlocked: boolean
) {
  if (!persistToServer || remaining === null || remaining >= 999_000) {
    return false;
  }

  // Infographic series for one SKU requires a paid kit / purchase.
  if (count > 1 && !seriesUnlocked) {
    return true;
  }

  return getRequiredGenerationsForCardsCount(count, category) > remaining;
}
const DEMO_MIN_LOADING_MS = 20_000;
const DEMO_PROGRESS_DURATION_MS = 280_000;
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

const GENERATE_BUTTON_CLASS =
  "relative overflow-hidden bg-[linear-gradient(135deg,#BFF93F_0%,#D4FF6B_48%,#ADFC00_100%)] text-on-accent ring-2 ring-accent/40 shadow-[0_0_0_5px_rgba(191,249,63,0.22),0_18px_46px_rgba(191,249,63,0.28)] hover:bg-[linear-gradient(135deg,#D4FF6B_0%,#BFF93F_52%,#E8FF8A_100%)] hover:ring-accent/70 hover:shadow-[0_0_0_7px_rgba(191,249,63,0.28),0_22px_58px_rgba(191,249,63,0.36)] disabled:ring-accent/15 disabled:shadow-none";

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
            <Star className="fill-accent text-accent-ink" size={21} />
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
  onVideoFlowReset,
  similarFromCard = null,
  kitFromCard = null,
  kitSlideTypes = null,
  kitStyleFromCard = null,
  openKitSeries = false,
  onSimilarSeedApplied
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
  similarFromCard?: ProductCardResult | null;
  /** Prefill form and open a full SKU kit series (5 slides). */
  kitFromCard?: ProductCardResult | null;
  /** Which kit slide types to preselect (missing ones when continuing). */
  kitSlideTypes?: string[] | null;
  /** New product kit, but copy style/layout from this card (no photo/description). */
  kitStyleFromCard?: ProductCardResult | null;
  /** Start a blank kit series (5 slides) without a source card. */
  openKitSeries?: boolean;
  onSimilarSeedApplied?: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [marketplace, setMarketplace] = useState("Wildberries");
  const [textMode, setTextMode] = useState(normalizeTextMode("marketplace_safe"));
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
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [designPreset, setDesignPreset] = useState<ImageDesignPreset>(normalizeDesignPreset("premium-marketplace"));
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
  const [previewReloadToken, setPreviewReloadToken] = useState(0);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [ratingPromptCardId, setRatingPromptCardId] = useState<string | null>(null);
  const [isSavingGenerationRating, setIsSavingGenerationRating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallVariant, setPaywallVariant] = useState<"series" | "quota_exhausted">("series");
  const [showKitOfferAfterGeneration, setShowKitOfferAfterGeneration] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);
  const [monthlyFreeResetsAt, setMonthlyFreeResetsAt] = useState<string | null>(null);
  const [downloadPolicy, setDownloadPolicy] = useState<DownloadPolicy | null>(null);
  const [hasUnlimitedAccess, setHasUnlimitedAccess] = useState(false);
  const [demoStatusIndex, setDemoStatusIndex] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isDemoGenerating, setIsDemoGenerating] = useState(false);
  const [layoutTemplateCard, setLayoutTemplateCard] = useState<ProductCardResult | null>(null);
  const [kitModeActive, setKitModeActive] = useState(false);
  const [continueSeriesId, setContinueSeriesId] = useState<string | null>(null);
  const [extraDetailsOpen, setExtraDetailsOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const videoUpsellRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const pendingImageGenerationTicketRef = useRef<string | null>(null);
  const descriptionTrackedRef = useRef(false);
  const videoUpsellTrackedRef = useRef<string | null>(null);
  const [emphasizeVideoOffer, setEmphasizeVideoOffer] = useState(false);
  const [requestVideoConfig, setRequestVideoConfig] = useState(false);

  const effectiveCategory = useMemo(
    () => resolveCategory({ description, category }),
    [category, description]
  );

  function openPaywall(variant: "series" | "quota_exhausted" = "series") {
    setPaywallVariant(variant);
    setShowPaywall(true);
  }

  async function refreshDownloadPolicy() {
    const quota = await fetchUserQuota();
    setRemainingGenerations(quota.remaining);
    setMonthlyFreeResetsAt(quota.monthlyFreeResetsAt ?? null);
    setHasUnlimitedAccess(Boolean(quota.unlimited));
    setDownloadPolicy({
      cleanDownloadGenerationId: quota.cleanDownloadGenerationId ?? null,
      downloadsFullyUnlocked: Boolean(quota.downloadsFullyUnlocked)
    });
    onQuotaChange?.(quota);
    return quota;
  }

  useEffect(() => {
    if (!persistToServer) return;

    refreshDownloadPolicy().catch(() => {
      setRemainingGenerations(null);
      setDownloadPolicy(null);
    });
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

  function clearLayoutTemplate() {
    setLayoutTemplateCard(null);
    setKitModeActive(false);
    setContinueSeriesId(null);
  }

  function applySimilarCardSeed(
    sourceCard: ProductCardResult,
    mode: "similar" | "kit" | "kit-style" = "similar",
    preferredTypes?: string[] | null
  ) {
    const source = sourceCard.sourceInput;
    const photo = mode === "kit-style" ? null : resolveSimilarCardPhoto(sourceCard);
    const nextDescription = mode === "kit-style" ? "" : resolveSimilarCardDescription(sourceCard);
    const hasExtraFields = Boolean(
      source?.brand ||
        source?.color ||
        source?.size ||
        source?.material ||
        source?.packageContents ||
        source?.sellerSku ||
        source?.dimensions ||
        source?.weight ||
        source?.targetAudience ||
        source?.useCase ||
        source?.oldPrice ||
        source?.discount ||
        sourceCard.price ||
        sourceCard.ctaText ||
        sourceCard.headline
    );
    const nextCategory = source?.category || sourceCard.category || "";
    const isKit = mode === "kit" || mode === "kit-style";
    const kitTypes =
      preferredTypes && preferredTypes.length > 0
        ? preferredTypes
        : getDefaultSeriesTypes(normalizeCardsCount(SKU_KIT_SLIDE_COUNT), nextCategory || "Другое");

    setLayoutTemplateCard(mode === "similar" || mode === "kit-style" ? sourceCard : null);
    setKitModeActive(isKit);
    setContinueSeriesId(mode === "kit" ? sourceCard.seriesId || sourceCard.id : null);
    setCard(null);
    setSeriesCards([]);
    setEditingCard(null);
    setError("");
    setDescription(nextDescription);
    setCategory(nextCategory);
    setMarketplace(normalizeMarketplaceLabel(source?.marketplace || sourceCard.marketplace));
    setTextMode(normalizeTextMode(source?.textMode || sourceCard.textMode));
    setStyle(normalizeCardStyle(source?.style || sourceCard.style));
    setBrand(mode === "kit-style" ? "" : source?.brand || "");
    setSellerSku(mode === "kit-style" ? "" : source?.sellerSku || "");
    setColor(mode === "kit-style" ? "" : source?.color || "");
    setSize(mode === "kit-style" ? "" : source?.size || "");
    setMaterial(mode === "kit-style" ? "" : source?.material || "");
    setDimensions(mode === "kit-style" ? "" : source?.dimensions || "");
    setWeight(mode === "kit-style" ? "" : source?.weight || "");
    setPackageContents(mode === "kit-style" ? "" : source?.packageContents || "");
    setTargetAudience(mode === "kit-style" ? "" : source?.targetAudience || "");
    setUseCase(mode === "kit-style" ? "" : source?.useCase || "");
    setOldPrice(mode === "kit-style" ? "" : source?.oldPrice || "");
    setDiscount(mode === "kit-style" ? "" : source?.discount || "");
    setHeadline(mode === "kit-style" ? "" : source?.headline || sourceCard.headline || "");
    setProductName(
      mode === "kit-style"
        ? ""
        : source?.identifiedProductName ||
            sourceCard.sourceInput?.identifiedProductName ||
            sourceCard.headline ||
            sourceCard.title ||
            ""
    );
    setPrice(mode === "kit-style" ? "" : source?.price || sourceCard.price || "");
    setCtaText(mode === "kit-style" ? "" : source?.ctaText || sourceCard.ctaText || "");
    setDesignPreset(normalizeDesignPreset(source?.designPreset || sourceCard.designPreset));
    setRemoveBackground(Boolean(source?.removeBackground));
    if (isKit) {
      const kitCount = normalizeCardsCount(Math.max(kitTypes.length, SKU_KIT_SLIDE_COUNT));
      setCardsCount(kitCount);
      setSelectedSeriesTypes(kitTypes);
    } else {
      setCardsCount(1);
      setSelectedSeriesTypes(["hero"]);
    }
    setExtraDetailsOpen(mode !== "kit-style" && hasExtraFields);
    setImageUrl(photo?.imageUrl || "");
    setImageFileName(photo?.imageFileName || "");
    setNotice(
      mode === "kit-style"
        ? `Новый товар в стиле «${getSimilarCardTitle(sourceCard)}»: загрузите фото и описание, выберите слайды комплекта.`
        : mode === "kit"
          ? photo
            ? `Товар «${getSimilarCardTitle(sourceCard)}»: фото и описание подставлены. Выберите слайды комплекта и нажмите генерацию.`
            : `Товар «${getSimilarCardTitle(sourceCard)}»: описание подставлено. Добавьте фото и выберите слайды комплекта.`
          : photo
            ? `Шаблон «${getSimilarCardTitle(sourceCard)}»: фото и описание подставлены. Можно сразу сгенерировать ещё 1 карточку.`
            : `Шаблон «${getSimilarCardTitle(sourceCard)}»: описание подставлено. Добавьте фото для новой карточки.`
    );

    window.requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    if (kitFromCard) {
      applySimilarCardSeed(kitFromCard, "kit", kitSlideTypes);
      onSimilarSeedApplied?.();
      return;
    }

    if (kitStyleFromCard) {
      applySimilarCardSeed(kitStyleFromCard, "kit-style", kitSlideTypes);
      onSimilarSeedApplied?.();
      return;
    }

    if (openKitSeries) {
      const kitCount = normalizeCardsCount(SKU_KIT_SLIDE_COUNT);
      const types =
        kitSlideTypes && kitSlideTypes.length > 0
          ? kitSlideTypes
          : getDefaultSeriesTypes(kitCount, "Другое");
      setKitModeActive(true);
      setContinueSeriesId(null);
      setLayoutTemplateCard(null);
      setCardsCount(kitCount);
      setSelectedSeriesTypes(types);
      setNotice(`Соберите комплект: выберите нужные слайды ниже. ${KIT_SERIES_DESCRIPTION}.`);
      onSimilarSeedApplied?.();
      return;
    }

    if (!similarFromCard) {
      return;
    }

    applySimilarCardSeed(similarFromCard, "similar");
    onSimilarSeedApplied?.();
    // Seed once per incoming card reference from the cabinet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [similarFromCard, kitFromCard, kitStyleFromCard, openKitSeries, kitSlideTypes]);

  useEffect(() => {
    if (cardsCount === 1) {
      if (!kitModeActive) {
        setSelectedSeriesTypes(["hero"]);
      }
      return;
    }

    if (kitModeActive) {
      return;
    }

    setSelectedSeriesTypes(getDefaultSeriesTypes(cardsCount, effectiveCategory));
  }, [cardsCount, effectiveCategory, kitModeActive]);

  useEffect(() => {
    const seriesUnlocked = Boolean(downloadPolicy?.downloadsFullyUnlocked || hasUnlimitedAccess);
    // Never silently collapse an intentional kit flow back to 1 card.
    if (persistToServer && cardsCount > 1 && !seriesUnlocked && !kitModeActive) {
      setCardsCount(1);
    }
  }, [cardsCount, downloadPolicy?.downloadsFullyUnlocked, hasUnlimitedAccess, kitModeActive, persistToServer]);

  useEffect(() => {
    if (!kitModeActive) {
      return;
    }

    const seriesUnlocked = Boolean(downloadPolicy?.downloadsFullyUnlocked || hasUnlimitedAccess);
    if (seriesUnlocked && cardsCount < SKU_KIT_SLIDE_COUNT) {
      setCardsCount(normalizeCardsCount(SKU_KIT_SLIDE_COUNT));
    }
  }, [kitModeActive, downloadPolicy?.downloadsFullyUnlocked, hasUnlimitedAccess, cardsCount]);

  useEffect(() => {
    if (!persistToServer || remainingGenerations === null || remainingGenerations >= 999_000) {
      return;
    }

    if (kitModeActive) {
      return;
    }

    if (getRequiredGenerationsForCardsCount(cardsCount, effectiveCategory) <= remainingGenerations) {
      return;
    }

    const fallback =
      [...cardCountOptions]
        .reverse()
        .find((count) => getRequiredGenerationsForCardsCount(count, effectiveCategory) <= remainingGenerations) ?? 1;

    setCardsCount(fallback);
  }, [cardsCount, effectiveCategory, persistToServer, remainingGenerations, kitModeActive]);

  const plannedGenerationCount =
    kitModeActive || cardsCount > 1 ? Math.max(1, selectedSeriesTypes.length) : 1;
  const seriesPlan = useMemo(
    () =>
      buildCardSeriesPlanFromTypes(selectedSeriesTypes, {
        category: effectiveCategory,
        marketplace,
        style,
        productDescription: description,
        headline: productName.trim() || headline
      }),
    [selectedSeriesTypes, description, effectiveCategory, headline, marketplace, productName, style]
  );
  const selectedCountExceedsQuota =
    persistToServer && remainingGenerations !== null && plannedGenerationCount > remainingGenerations;
  const showQuotaExceededWarning = selectedCountExceedsQuota && !isLoading;

  useEffect(() => {
    setHistory(getHistory());
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
      layoutTemplate?: ProductCardResult;
    } = {}
  ) {
    const seriesCount = options.seriesCount ?? plannedGenerationCount;
    const snapshotSource = options.preserveCard || options.layoutTemplate;
    const previousCard = snapshotSource ? buildPreviousCardSnapshot(snapshotSource) : undefined;
    const seriesInstructions = options.planItem
      ? buildSeriesEditInstructions(options.planItem, seriesCount)
      : undefined;
    const requestPayload = {
      ...payload,
      productDescription: payload.productDescription,
      identifiedProductName:
        payload.identifiedProductName?.trim() || productName.trim() || payload.identifiedProductName,
      editInstructions: [options.editInstructions, seriesInstructions].filter(Boolean).join("\n\n") || undefined,
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
        openPaywall("quota_exhausted");
      }
      if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setNotice(data.error || "Подтвердите email, чтобы генерировать карточки.");
      }
      throw new Error(data.error || "Не удалось создать карточку. Попробуйте ещё раз.");
    }

    const { quota: _quota, error: _error, imageGenerationTicket, ...cardPayload } = data;
    if (imageGenerationTicket) {
      pendingImageGenerationTicketRef.current = imageGenerationTicket;
    }
    const planItem = options.planItem;
    const preserveCard = options.preserveCard;
    const { imageBase64: _imageBase64, imageMimeType: _imageMimeType, ...sourceInputPayload } = requestPayload;
    const aiCard = cardPayload as ProductCardResult;
    const aiBenefits = Array.isArray(aiCard.benefits)
      ? aiCard.benefits.filter((item) => item.trim() && !isMetaMarketplaceVisibleText(item))
      : [];
    const aiInfographic = Array.isArray(aiCard.infographicTexts)
      ? aiCard.infographicTexts.filter((item) => item.trim() && !isMetaMarketplaceVisibleText(item))
      : [];
    const productHeadline =
      (payload.identifiedProductName || productName || planItem?.mainHeadline || headline || aiCard.title || "")
        .trim();
    const visibleTitle =
      planItem?.type === "hero"
        ? productHeadline || aiCard.title
        : !isMetaMarketplaceVisibleText(aiCard.title)
          ? aiCard.title
          : productHeadline || aiCard.title;
    const visibleShort =
      planItem?.type === "hero"
        ? aiCard.shortDescription
        : !isMetaMarketplaceVisibleText(aiCard.shortDescription)
          ? aiCard.shortDescription
          : "";
    const generatedCard: ProductCardResult = {
      ...aiCard,
      id: preserveCard?.id || aiCard.id,
      title: visibleTitle,
      shortDescription: visibleShort || aiCard.shortDescription,
      benefits: aiBenefits,
      keywords: Array.isArray(aiCard.keywords) ? aiCard.keywords : [],
      infographicTexts: [
        visibleTitle,
        ...aiBenefits,
        ...aiInfographic
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value) => !isMetaMarketplaceVisibleText(value))
        .filter((value, index, list) => list.indexOf(value) === index)
        .slice(0, 4),
      visualConcept: planItem
        ? `${planItem.visualIdea}. Единый стиль серии: ${buildSeriesStyleGuide(style, marketplace)}`
        : aiCard.visualConcept,
      imageDataUrl: imageUrl || undefined,
      headline: visibleTitle || headline.trim() || undefined,
      price: price.trim() || undefined,
      ctaText: ctaText.trim() || undefined,
      designPreset,
      seriesId: options.seriesId ?? preserveCard?.seriesId,
      seriesIndex: planItem?.index ?? preserveCard?.seriesIndex,
      seriesCount: (options.seriesCount ?? preserveCard?.seriesCount ?? plannedGenerationCount) as CardSeriesCount,
      seriesPlanItem: planItem ?? preserveCard?.seriesPlanItem,
      seriesStyleGuide:
        options.seriesId || preserveCard?.seriesId
          ? buildSeriesStyleGuide(style, marketplace)
          : preserveCard?.seriesStyleGuide || options.layoutTemplate?.seriesStyleGuide,
      sourceInput: {
        ...sourceInputPayload,
        headline: visibleTitle || headline.trim() || undefined,
        identifiedProductName: payload.identifiedProductName || productHeadline || undefined,
        price: price.trim() || undefined,
        ctaText: ctaText.trim() || undefined,
        designPreset,
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

    const confirmedProductName = productName.trim() || headline.trim();
    if (!confirmedProductName) {
      setError("Укажите название товара — проверьте, что ИИ поймёт именно ваш товар.");
      return;
    }

    if (persistToServer && remainingGenerations === 0) {
      openPaywall("quota_exhausted");
      return;
    }

    if (selectedCountExceedsQuota) {
      setError(
        `Для серии нужно ${plannedGenerationCount} слайдов, а доступно ${remainingGenerations}. Уменьшите количество или купите комплект.`
      );
      openPaywall(cardsCount > 1 ? "series" : "quota_exhausted");
      return;
    }

    if (removeBackground) {
      await handleBackgroundRemoval();
    }

    setIsLoading(true);
    setSeriesCards([]);
    setRatingPromptCardId(null);
    const imagePayload = imageUrl ? dataUrlToBase64(imageUrl) : null;
    const payload = normalizeProductCardInput({
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
      identifiedProductName: confirmedProductName,
      brand,
      sellerSku,
      color,
      size,
      material,
      dimensions,
      weight,
      packageContents,
      targetAudience,
      useCase,
      price,
      oldPrice,
      discount
    });

    if (!persistToServer) {
      await handleDemoSubmit(payload);
      return;
    }

    try {
      const similarLayoutInstructions = layoutTemplateCard
        ? buildSimilarLayoutInstructions(layoutTemplateCard)
        : undefined;

      if (cardsCount === 1 && !kitModeActive) {
        const { card: generatedCard, quota, imageGenerationTicket } = await createGeneratedProductCard(payload, {
          layoutTemplate: layoutTemplateCard || undefined,
          editInstructions: similarLayoutInstructions
        });
        setCard(generatedCard);
        setNotice("Создаём обложку…");
        const finalCard = await generateAiMarketplaceImage(
          generatedCard,
          similarLayoutInstructions,
          imageGenerationTicket
        );
        if (finalCard && hasGeneratedAiCover(finalCard)) {
          await persistGeneratedCard(finalCard);
        }

        trackConversion("generation_complete", { marketplace, platform: payload.platform || "wildberries" });
        reachGoal("generate_card", {
          marketplace,
          designPreset,
          cardsCount,
          hasImage: hasGeneratedImage(finalCard ?? generatedCard),
          similarFrom: Boolean(layoutTemplateCard)
        });

        if (quota?.remaining === 0) {
          setShowKitOfferAfterGeneration(true);
        }
        return;
      }

      const seriesId = continueSeriesId || crypto.randomUUID();
      const completedCards: ProductCardResult[] = [];
      const seriesTotal = kitModeActive ? SKU_KIT_SLIDE_COUNT : seriesPlan.length;

      for (const planItem of seriesPlan) {
        try {
          setSeriesProgress(`Генерируется слайд ${planItem.index} из ${seriesPlan.length}`);
          setNotice(`Генерируется слайд комплекта: ${planItem.title}`);
          const { card: generatedCard, imageGenerationTicket } = await createGeneratedProductCard(payload, {
            planItem,
            seriesId,
            seriesCount: seriesTotal,
            layoutTemplate: layoutTemplateCard || undefined,
            editInstructions: similarLayoutInstructions
          });
          setCard(generatedCard);
          const finalCard = await generateAiMarketplaceImage(
            generatedCard,
            similarLayoutInstructions,
            imageGenerationTicket
          );
          const readyCard = finalCard ?? generatedCard;
          completedCards.push(readyCard);
          setSeriesCards([...completedCards]);
          if (hasGeneratedAiCover(readyCard)) {
            await persistGeneratedCard(readyCard, { silent: true });
          } else if (readyCard.generationId || extractProviderGenerationId(readyCard.generatedImageError)) {
            setNotice(`Слайд ${planItem.index}: проверяем результат у провайдера…`);
            const recovered = await recoverProviderImageForCard(
              readyCard,
              (readyCard.generationId ||
                extractProviderGenerationId(readyCard.generatedImageError)) as string,
              { attempts: 3, nested: true }
            );
            if (recovered && hasGeneratedAiCover(recovered)) {
              completedCards[completedCards.length - 1] = recovered;
              setSeriesCards([...completedCards]);
              await persistGeneratedCard(recovered, { silent: true });
            }
          }
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Не удалось создать карточку.";
          const isQuotaError = /генерац|пакет|лимит/i.test(message);

          if (isQuotaError) {
            setError(message);
            openPaywall("quota_exhausted");
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
        setNotice(
          kitModeActive
            ? `Готово: добавлено ${readyCards.length} слайдов комплекта.`
            : `Готово: создано ${readyCards.length} из ${seriesTotal} карточек серии.`
        );
        setKitModeActive(false);
        setContinueSeriesId(null);
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

    const guestId = getOrCreateGuestId();

    try {
      const image = dataUrlToBase64(imageUrl);
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
          imageProvider: resolveNanoBananaImageProvider(getImageSettings().imageProvider),
          headline: headline.trim() || undefined,
          price: price.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          designPreset: normalizeDesignPreset(designPreset)
        })
      });
      const data = await parseJsonResponse<{
        id?: string;
        existingDemoId?: string;
        error?: string;
        code?: string;
      }>(response);

      const generationId =
        data.existingDemoId ||
        (response.ok ? data.id : undefined) ||
        (data.code === "DEMO_LIMIT_EXCEEDED"
          ? data.id || (await fetchLatestGuestDemoId(guestId))
          : undefined);

      if (!generationId) {
        throw new Error(data.error || DEMO_GENERATION_ERROR);
      }

      const remainingDelay = Math.max(0, DEMO_MIN_LOADING_MS - (Date.now() - startedAt));
      await wait(remainingDelay);
      setDemoProgress(100);
      trackMarketingEvent("demo_generation_completed", {
        marketplace,
        generationId
      });
      router.push(`/generations/${generationId}?guestId=${encodeURIComponent(guestId)}`);
    } catch (caught) {
      const message = toUserFacingError(caught);
      const looksTransient =
        /слишком много времени|временно недоступен|failed to fetch|networkerror|load failed|не получилось создать карточку/i.test(
          message
        );

      if (looksTransient) {
        const recoveredId = await fetchLatestGuestDemoId(guestId, { maxAgeMs: 30 * 60 * 1000 });
        if (recoveredId) {
          setDemoProgress(100);
          trackMarketingEvent("demo_generation_completed", {
            marketplace,
            generationId: recoveredId,
            recovered: true
          });
          router.push(`/generations/${recoveredId}?guestId=${encodeURIComponent(guestId)}`);
          return;
        }
      }

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
    setProductName("");
    setPrice("");
    setCtaText("");
    setDesignPreset(normalizeDesignPreset("premium-marketplace"));
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
      return true;
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
        setPreviewReloadToken((value) => value + 1);
      }
      await refreshDownloadPolicy();
      onSaved?.();
      reachGoal("save_to_history", { automatic: true });
      if (!options.silent) {
        setNotice("Готово! Карточка сохранена в историю. Скачайте PNG или JSON.");
      }
      return true;
    } catch {
      setError("Не удалось сохранить карточку в историю. Попробуйте ещё раз или нажмите «Сохранить в историю».");
      if (!options.silent) {
        setNotice("");
      }
      return false;
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
    setMarketplace(normalizeMarketplaceLabel(cardFromHistory.marketplace));
    setTextMode(normalizeTextMode(cardFromHistory.textMode));
    setStyle(normalizeCardStyle(cardFromHistory.style));
    setCategory(cardFromHistory.category);
    setHeadline(cardFromHistory.headline || "");
    setProductName(
      cardFromHistory.sourceInput?.identifiedProductName ||
        cardFromHistory.headline ||
        cardFromHistory.title ||
        ""
    );
    setPrice(cardFromHistory.price || "");
    setCtaText(cardFromHistory.ctaText || "");
    setDesignPreset(normalizeDesignPreset(cardFromHistory.designPreset));
    setImageUrl(cardFromHistory.imageDataUrl ?? "");
    setImageFileName(cardFromHistory.imageDataUrl ? "Фото из истории" : "");
    setNotice("Карточка открыта.");
  }

  async function handleDownloadBestImage() {
    if (!displayCard || !card) {
      return;
    }

    reachGoal("download_png");
    trackConversion("download_png", {
      source: persistToServer ? "cabinet" : "local",
      series: Boolean(displayCard.seriesId)
    });
    await downloadBestImage(displayCard, renderedImageUrl, previewRef.current);

    if (persistToServer && hasGeneratedAiCover(displayCard)) {
      setEmphasizeVideoOffer(true);
      trackMarketingEvent("video_upsell_view", { source: "png_download" });
      window.requestAnimationFrame(() => {
        videoUpsellRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }

  async function handleDownloadSeriesCard(seriesCard: ProductCardResult, index: number) {
    const displaySeriesCard =
      persistToServer && downloadPolicy
        ? applyDownloadPolicyToCard(seriesCard, downloadPolicy, persistToServer)
        : seriesCard;

    reachGoal("download_png", { source: "series", seriesIndex: seriesCard.seriesIndex ?? index + 1 });
    trackConversion("download_png", { source: "series", seriesIndex: seriesCard.seriesIndex ?? index + 1 });
    await downloadCardImage(displaySeriesCard, `marketcard-series-${seriesCard.seriesIndex ?? index + 1}.png`);
  }

  async function handleDownloadSeriesZip() {
    const downloadableCards = displaySeriesCards.filter((item) => hasGeneratedAiCover(item));

    const files = await Promise.all(
      downloadableCards.map(async (seriesCard, index) => {
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
      openPaywall("quota_exhausted");
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
    setNotice("Перегенерируем карточку (1 пробная карточка)…");
    setIsLoading(true);

    try {
      const { card: generatedCard, imageGenerationTicket } = await createGeneratedProductCard(payload, {
        planItem: cardToEdit.seriesPlanItem,
        seriesId: cardToEdit.seriesId,
        seriesCount: cardToEdit.seriesCount ?? plannedGenerationCount,
        editInstructions: instructions.trim(),
        preserveCard: cardToEdit
      });
      setCard(generatedCard);
      const finalCard = await generateAiMarketplaceImage(
        generatedCard,
        instructions.trim(),
        imageGenerationTicket ?? pendingImageGenerationTicketRef.current ?? undefined
      );
      const readyCard = finalCard ?? generatedCard;

      setCard(readyCard);
      if (seriesCards.length) {
        setSeriesCards((items) => items.map((item) => (item.id === cardToEdit.id ? readyCard : item)));
      }
      await persistGeneratedCard(readyCard, { silent: true });
      setEditingCard(null);
      setEditInstructions("");
      setNotice("Карточка обновлена. Списана 1 пробная карточка.");
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

    const providerJobId = cardToRetry.generationId || extractProviderGenerationId(cardToRetry.generatedImageError);
    if (!providerJobId) {
      setError("Нет id задания у провайдера. Подождите минуту и нажмите «Проверить у провайдера» ещё раз.");
      return;
    }

    const recovered = await recoverProviderImageForCard(cardToRetry, providerJobId, { attempts: 3 });
    if (recovered && hasGeneratedAiCover(recovered)) {
      setCard(recovered);
      setSeriesCards((items) => items.map((item) => (item.seriesIndex === planItem.index ? recovered : item)));
      await persistGeneratedCard(recovered, { silent: true });
      setNotice(`Слайд ${planItem.index}: результат подтянут у провайдера.`);
      return;
    }

    setError("У провайдера пока нет готового файла. Подождите 20–30 секунд и нажмите «Проверить у провайдера».");
  }

  async function recoverProviderImageForCard(
    cardForImage: ProductCardResult,
    generationId: string,
    options: { attempts?: number; nested?: boolean } = {}
  ) {
    const attempts = Math.max(1, options.attempts ?? 1);
    if (!options.nested) {
      setIsGeneratingAiImage(true);
    }
    setError("");
    setNotice("Проверяем результат у провайдера…");

    try {
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        if (attempt > 1) {
          setNotice(`Проверяем у провайдера ещё раз (${attempt}/${attempts})…`);
          await new Promise((resolve) => window.setTimeout(resolve, 2500));
        }

        const response = await fetch("/api/generate-image/recover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationId,
            imageGenerationTicket: pendingImageGenerationTicketRef.current ?? undefined
          })
        });
        const data = (await response.json()) as GenerateImageResult & {
          error?: string;
          quota?: { remaining: number; used: number; credits: number; unlimited?: boolean };
          imageGenerationTicket?: string;
          recovered?: boolean;
          charged?: boolean;
        };

        if (data.imageGenerationTicket) {
          pendingImageGenerationTicketRef.current = data.imageGenerationTicket;
        }
        if (data.quota?.remaining !== undefined) {
          setRemainingGenerations(data.quota.remaining);
          setHasUnlimitedAccess(Boolean(data.quota.unlimited));
          onQuotaChange?.(data.quota);
        }

        if (!response.ok) {
          continue;
        }

        const updatedCard = applyImageResult(cardForImage, data);
        if (hasUsableImage(data)) {
          pendingImageGenerationTicketRef.current = null;
          setError("");
          setNotice(
            data.charged
              ? "Результат подтянут у провайдера."
              : "Результат подтянут у провайдера без новой генерации."
          );
          return updatedCard;
        }
      }

      return null;
    } catch {
      return null;
    } finally {
      if (!options.nested) {
        setIsGeneratingAiImage(false);
      }
    }
  }

  async function handleRecoverSeriesCard(cardToRecover: ProductCardResult) {
    const providerJobId =
      cardToRecover.generationId || extractProviderGenerationId(cardToRecover.generatedImageError);

    if (!providerJobId) {
      setError("Нет id задания у провайдера. Подождите и нажмите «Проверить у провайдера» ещё раз.");
      return;
    }

    const recovered = await recoverProviderImageForCard(cardToRecover, providerJobId, { attempts: 3 });
    if (!recovered || !hasGeneratedAiCover(recovered)) {
      setError("У провайдера пока нет готового результата. Подождите 20–30 секунд и проверьте снова.");
      return;
    }

    setCard(recovered);
    setSeriesCards((items) =>
      items.map((item) =>
        item.id === cardToRecover.id || item.seriesIndex === cardToRecover.seriesIndex ? recovered : item
      )
    );
    await persistGeneratedCard(recovered, { silent: true });
  }

  async function handleRegenerateMissingSeriesCards() {
    const failed = seriesCards.filter((item) => !hasGeneratedAiCover(item));
    if (!failed.length) {
      setNotice("Все слайды серии уже готовы.");
      return;
    }

    setIsLoading(true);
    setError("");
    setNotice(`Проверяем недостающие у провайдера: ${failed.length}…`);

    try {
      for (const failedCard of failed) {
        const providerJobId = failedCard.generationId || extractProviderGenerationId(failedCard.generatedImageError);
        if (!providerJobId) {
          continue;
        }

        const recovered = await recoverProviderImageForCard(failedCard, providerJobId, { attempts: 3 });
        if (recovered && hasGeneratedAiCover(recovered)) {
          setSeriesCards((items) =>
            items.map((item) => (item.seriesIndex === failedCard.seriesIndex ? recovered : item))
          );
          await persistGeneratedCard(recovered, { silent: true });
        }
      }
      setNotice("Проверка у провайдера завершена.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось проверить слайды у провайдера.");
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
        generatedImageError: getImageGenerationRetryMessage(data.error),
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
    setPreviewReloadToken((value) => value + 1);
    return updatedCard;
  }

  async function generateAiMarketplaceImage(
    cardForImage: ProductCardResult,
    editInstructions?: string,
    imageGenerationTicket?: string
  ): Promise<ProductCardResult | null> {
    const inSeriesBatch = Boolean(cardForImage.seriesCount && cardForImage.seriesCount > 1 && isLoading);
    const productImage = imageUrl || cardForImage.imageDataUrl;
    const ticket = imageGenerationTicket ?? pendingImageGenerationTicketRef.current ?? undefined;

    if (!productImage) {
      setNotice("Тексты готовы. Загрузите фото, чтобы создать обложку.");
      return cardForImage;
    }

    setIsGeneratingAiImage(true);
    setError("");

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
    const templateStyleGuide =
      layoutTemplateCard?.seriesStyleGuide ||
      (layoutTemplateCard
        ? buildSeriesStyleGuide(layoutTemplateCard.style || style, layoutTemplateCard.marketplace || marketplace)
        : undefined);
    const effectiveDesignPreset = normalizeDesignPreset(layoutTemplateCard?.designPreset || designPreset);
    const visibleInfographicTexts = (cardForImage.infographicTexts || []).filter(
      (text) => text.trim() && !isMetaMarketplaceVisibleText(text)
    );
    const visibleBenefits = (cardForImage.benefits || []).filter(
      (text) => text.trim() && !isMetaMarketplaceVisibleText(text)
    );

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: cardForImage.seriesPlanItem
            ? buildSeriesCardDescription(
                baseCardInput,
                cardForImage.seriesPlanItem,
                cardForImage.seriesCount ?? plannedGenerationCount
              )
            : baseCardInput.productDescription,
          category: cardForImage.category,
          style: layoutTemplateCard?.style || style,
          marketplace: layoutTemplateCard?.marketplace || marketplace,
          title: cardForImage.title,
          benefits: visibleBenefits,
          infographicTexts: visibleInfographicTexts,
          characteristics: cardForImage.characteristics,
          keywords: cardForImage.keywords,
          imageBase64: image.base64,
          imageMimeType: image.mimeType,
          imageProvider: resolveNanoBananaImageProvider(getImageSettings().imageProvider),
          headline: productName.trim() || headline.trim() || undefined,
          price: price.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          designPreset: effectiveDesignPreset,
          model: NANO_BANANA_IMAGE_MODEL,
          aspectRatio: NANO_BANANA_ASPECT_RATIO,
          resolution: NANO_BANANA_RESOLUTION,
          outputFormat: NANO_BANANA_OUTPUT_FORMAT,
          imageGenerationTicket: ticket,
          seriesStyleGuide: cardForImage.seriesStyleGuide || templateStyleGuide,
          seriesCardType: cardForImage.seriesPlanItem?.type,
          seriesCardGoal: cardForImage.seriesPlanItem?.goal,
          seriesCardVisualIdea:
            cardForImage.seriesPlanItem?.visualIdea || layoutTemplateCard?.visualConcept || undefined,
          badges: [],
          editInstructions: editInstructions?.trim() || undefined
        })
      });
      const data = (await response.json()) as GenerateImageResult & {
        error?: string;
        code?: string;
        quota?: { remaining: number; used: number; credits: number };
        imageGenerationTicket?: string;
      };

      if (response.status === 402) {
        setRemainingGenerations(data.quota?.remaining ?? 0);
        if (data.quota) onQuotaChange?.(data.quota);
        openPaywall("quota_exhausted");
        throw new Error(data.error || "Лимит генераций исчерпан.");
      }

      if (response.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
        setNotice(data.error || "Подтвердите email, чтобы генерировать карточки.");
        throw new Error(data.error || "Подтвердите email.");
      }

      if (data.imageGenerationTicket) {
        pendingImageGenerationTicketRef.current = data.imageGenerationTicket;
      }
      if (data.quota) {
        setRemainingGenerations(data.quota.remaining);
        onQuotaChange?.(data.quota);
      }

      if (response.ok && hasUsableImage(data)) {
        pendingImageGenerationTicketRef.current = null;
        const updatedCard = applyImageResult(cardForImage, data);
        if (!inSeriesBatch) {
          setError("");
          setNotice("Готово! Скачайте карточку и загрузите на маркетплейс.");
        }
        return updatedCard;
      }

      // Image not ready in this response — do NOT start a new generation.
      // The provider usually already has the job; pull it by generation_id.
      const failedCard = applyImageResult(cardForImage, {
        ...data,
        error: getImageGenerationRetryMessage(data.error),
        generationId: data.generationId || extractProviderGenerationId(data.error)
      });
      const providerJobId = failedCard.generationId || data.generationId || extractProviderGenerationId(data.error);

      if (providerJobId) {
        setNotice(
          inSeriesBatch
            ? `Слайд ${cardForImage.seriesIndex ?? ""}: картинка уже у провайдера, подтягиваем…`
            : "Картинка уже у провайдера — подтягиваем без новой генерации…"
        );
        const recovered = await recoverProviderImageForCard(failedCard, providerJobId, {
          attempts: 3,
          nested: true
        });
        if (recovered && hasGeneratedAiCover(recovered)) {
          if (!inSeriesBatch) {
            setError("");
            setNotice("Готово! Скачайте карточку и загрузите на маркетплейс.");
          }
          return recovered;
        }
      }

      if (!inSeriesBatch) {
        setNotice("");
        setError(
          providerJobId
            ? "Картинка ещё готовится у провайдера. Нажмите «Проверить у провайдера»."
            : getImageGenerationRetryMessage(data.error)
        );
      }
      return failedCard;
    } catch (caught) {
      const failureMessage = getImageGenerationRetryMessage(
        caught instanceof Error ? caught.message : "Неизвестная ошибка генерации изображения"
      );
      const updatedCard = applyImageResult(cardForImage, {
        imageBase64: null,
        imageUrl: null,
        mimeType: null,
        provider: cardForImage.generatedImageProvider || "auto",
        model: "error",
        prompt: cardForImage.generatedImagePrompt || cardForImage.shortDescription,
        generatedAt: new Date().toISOString(),
        isFallback: true,
        error: failureMessage
      });
      if (!inSeriesBatch) {
        setNotice("");
        setError(failureMessage);
      }
      return updatedCard;
    } finally {
      setIsGeneratingAiImage(false);
    }
  }

  async function handleRetryImageCover() {
    if (!card) {
      return;
    }

    const providerJobId = card.generationId || extractProviderGenerationId(card.generatedImageError);
    if (!providerJobId) {
      setError("Нет id задания у провайдера. Подождите и нажмите «Проверить у провайдера».");
      return;
    }

    const recovered = await recoverProviderImageForCard(card, providerJobId, { attempts: 3 });
    if (recovered && hasGeneratedAiCover(recovered)) {
      setCard(recovered);
      await persistGeneratedCard(recovered, { silent: true });
      return;
    }

    setError("У провайдера пока нет готового файла. Подождите 20–30 секунд и проверьте снова.");
  }

  async function handleRecoverImageCover() {
    await handleRetryImageCover();
  }

  const displayCard =
    card && persistToServer ? applyDownloadPolicyToCard(card, downloadPolicy, persistToServer) : card;
  const displaySeriesCards = useMemo(
    () =>
      persistToServer
        ? seriesCards.map((seriesCard) => applyDownloadPolicyToCard(seriesCard, downloadPolicy, persistToServer))
        : seriesCards,
    [downloadPolicy, persistToServer, seriesCards]
  );
  const seriesReadyCount = useMemo(
    () => displaySeriesCards.filter((item) => hasGeneratedAiCover(item)).length,
    [displaySeriesCards]
  );
  const seriesFailedCount = useMemo(
    () =>
      displaySeriesCards.filter(
        (item) => !hasGeneratedAiCover(item) && Boolean(item.generatedImageError || item.generatedImageIsFallback)
      ).length,
    [displaySeriesCards]
  );

  const hasAiCover = Boolean(
    card &&
      !isGeneratingAiImage &&
      (hasGeneratedAiCover(card) || Boolean(displayCard && hasGeneratedAiCover(displayCard)))
  );
  const shouldShowGenerationRatingPrompt = Boolean(
    displayCard &&
      hasAiCover &&
      ratingPromptCardId === displayCard.id &&
      !displayCard.generationRating &&
      !displayCard.generationRatingDismissedAt
  );

  const canDownloadCurrentCard = Boolean(
    displayCard && canDownloadCardImage(displayCard, downloadPolicy, persistToServer)
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
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent-ink">
                <Loader2 className="animate-spin" size={30} />
              </div>
              <h2 className={`text-3xl font-black md:text-5xl ${darkConsole ? "text-white" : "text-ink"}`}>
                Создаём вашу карточку
              </h2>
              <p className={`mt-4 text-base font-semibold ${darkConsole ? "text-white/55" : "text-muted"}`}>
                Обычно 1–2 минуты в зависимости от загрузки сервиса
              </p>
              <div className={`mt-8 overflow-hidden rounded-full ${darkConsole ? "bg-white/10" : "bg-ink/10"}`}>
                <div
                  className="h-3 rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm font-bold">
                <span className={darkConsole ? "text-white/70" : "text-muted"}>{DEMO_LOADING_STATUSES[demoStatusIndex]}</span>
                <span className={darkConsole ? "text-accent-ink" : "text-accent-ink"}>{demoProgress}%</span>
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
        monthlyFreeResetsAt={monthlyFreeResetsAt}
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
        variant={paywallVariant}
      />
      <div className={shellClass}>
        <div className={embeddedLayoutClass}>
          <form className={`${formClass} min-w-0`} onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:gap-5" ref={formTopRef}>
              <div>
                <p className={`text-sm font-semibold ${labelClass}`}>
                  {compactDemoEntry ? "Попробуйте на своём товаре" : "Товар"}
                </p>
                <p className={`mt-1 text-sm ${darkConsole ? "text-white/45" : "text-muted"}`}>
                  {compactDemoEntry
                    ? "Загрузите фото и добавьте короткое описание — демо запустится без входа."
                    : persistToServer
                      ? "Сначала фото и описание — остальное можно не трогать"
                      : "Фото и описание"}
                </p>
              </div>
              {kitModeActive ? (
                <div
                  className={`rounded-[16px] border px-3 py-3 ${
                    darkConsole ? "border-mint/25 bg-mint/10" : "border-mint/30 bg-mint/10"
                  }`}
                >
                  <p className={`text-sm font-black ${labelClass}`}>Комплект для этого товара</p>
                  <p className={`mt-1 text-xs font-semibold leading-relaxed sm:text-sm ${darkConsole ? "text-white/70" : "text-muted"}`}>
                    Фото и описание уже подставлены. Отметьте, какие слайды сгенерировать — остальные можно добавить позже.
                    Не создаём заново то, что уже есть, если вы снимите галочки.
                  </p>
                </div>
              ) : null}
              {layoutTemplateCard ? (
                <div
                  className={`flex flex-col gap-2 rounded-[16px] border px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    darkConsole ? "border-mint/25 bg-mint/10" : "border-mint/30 bg-mint/10"
                  }`}
                >
                  <p className={`text-xs font-semibold leading-relaxed sm:text-sm ${labelClass}`}>
                    Режим «похожая»: стиль и блоки как у «{getSimilarCardTitle(layoutTemplateCard)}». Поменяйте
                    описание и фото — макет постараемся сохранить.
                  </p>
                  <Button
                    className="shrink-0 self-start sm:self-auto"
                    onClick={clearLayoutTemplate}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <X size={14} />
                    Сбросить шаблон
                  </Button>
                </div>
              ) : null}
              <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                <span className="grid gap-0.5">
                  <span>1. Фото товара</span>
                  {persistToServer ? (
                    <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                      Главное фото товара — как на витрине. Можно заменить на другое в любой момент.
                    </span>
                  ) : null}
                </span>
                <div className={`rounded-[18px] border border-dashed p-4 ${darkConsole ? "border-white/20 bg-white/5" : "border-clay bg-paper"}`}>
                  <Input
                    accept="image/*"
                    onClick={() => trackMarketingEvent("photo_upload_started")}
                    onChange={(event) => handleImage(event.target.files?.[0])}
                    type="file"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <ImageUp size={15} />
                    {imageFileName || "JPG или PNG, до 10 МБ"}
                    {imageUrl ? (
                      <button
                        className="font-semibold text-accent-ink underline-offset-2 hover:underline"
                        onClick={() => {
                          setImageUrl("");
                          setImageFileName("");
                        }}
                        type="button"
                      >
                        Убрать фото
                      </button>
                    ) : null}
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
                <span className="grid gap-0.5">
                  <span>2. Описание товара</span>
                  {persistToServer ? (
                    <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                      Своими словами: что это, цвет, материал, для кого, чем отличается. Не нужно писать «продающий» текст.
                    </span>
                  ) : null}
                </span>
                <Textarea
                  onChange={(event) => handleDescriptionChange(event.target.value)}
                  placeholder={
                    persistToServer
                      ? "Например: букет из 11 белых роз, высота 50 см, в крафт-бумаге, для подарка"
                      : "Например: беспроводные наушники с шумоподавлением, чёрные, с кейсом"
                  }
                  rows={4}
                  value={description}
                />
              </label>
              {!compactDemoEntry ? (
              <>
              {persistToServer ? (
              <div className={`border-t pt-5 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <p className={`text-sm font-semibold ${labelClass}`}>3. Площадка и стиль</p>
                <p className={`mt-1 text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                  Куда выкладываете и какой вайб карточки. Если не уверены — оставьте как есть.
                </p>
              </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  <span className="grid gap-0.5">
                    Категория
                    {persistToServer ? (
                      <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        Можно коротко: «цветы», «наушники», «платье»
                      </span>
                    ) : null}
                  </span>
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
                    {CARD_MARKETPLACES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  <span className="grid gap-0.5">
                    Стиль
                    {persistToServer ? (
                      <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        Настроение дизайна, не цвет товара
                      </span>
                    ) : null}
                  </span>
                  <Select onChange={(event) => setStyle(event.target.value)} value={style} variant={selectVariant}>
                    {CARD_STYLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
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
                {kitModeActive ? (
                  <div className="grid gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${labelClass}`}>Какие слайды комплекта сгенерировать</p>
                      <p className={`mt-1 text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        Отметьте нужные типы. Уже готовые можно не выбирать — генерируем только отмеченные.
                      </p>
                    </div>
                    <SeriesTypePicker
                      category={effectiveCategory}
                      darkConsole={darkConsole}
                      marketplace={marketplace}
                      onChange={(types) => {
                        setSelectedSeriesTypes(types);
                        if (types.length > 1) {
                          setCardsCount(normalizeCardsCount(Math.max(types.length, SKU_KIT_SLIDE_COUNT)));
                        }
                      }}
                      selectedTypes={selectedSeriesTypes}
                      style={style}
                    />
                    <p className={`text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      Выбрано{" "}
                      <span className="font-semibold text-accent-ink">{plannedGenerationCount}</span> слайдов комплекта.
                    </p>
                  </div>
                ) : (
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Сколько карточек
                  <Select
                    onChange={(event) => setCardsCount(normalizeCardsCount(event.target.value))}
                    onDisabledOptionClick={() => openPaywall("series")}
                    value={cardsCount}
                    variant={selectVariant}
                  >
                    {cardCountOptions.map((count) => {
                      const locked = isCardCountOptionLocked(
                        count,
                        remainingGenerations,
                        persistToServer,
                        effectiveCategory,
                        Boolean(downloadPolicy?.downloadsFullyUnlocked || hasUnlimitedAccess)
                      );

                      return (
                        <option disabled={locked} key={count} value={count}>
                          {count === 1 ? "1 карточка" : `${count} карточки · серия`}
                          {locked ? " · доступно в комплекте" : ""}
                        </option>
                      );
                    })}
                  </Select>
                </label>
                )}
                {!kitModeActive &&
                persistToServer &&
                remainingGenerations !== null &&
                remainingGenerations < 999_000 &&
                !downloadPolicy?.downloadsFullyUnlocked &&
                !hasUnlimitedAccess ? (
                  <p className={`mt-2 text-xs font-semibold leading-relaxed ${darkConsole ? "text-white/45" : "text-muted"}`}>
                    {describeFreeQuotaMarketing()}. {KIT_SERIES_DESCRIPTION} — доступно в комплекте —{" "}
                    <button
                      className="text-accent-ink underline-offset-2 hover:underline"
                      onClick={() => openPaywall("series")}
                      type="button"
                    >
                      купить комплект
                    </button>
                    .
                  </p>
                ) : !kitModeActive &&
                  persistToServer &&
                  remainingGenerations !== null &&
                  remainingGenerations < 999_000 &&
                  cardCountOptions.some((count) =>
                    isCardCountOptionLocked(
                      count,
                      remainingGenerations,
                      persistToServer,
                      effectiveCategory,
                      Boolean(downloadPolicy?.downloadsFullyUnlocked || hasUnlimitedAccess)
                    )
                  ) ? (
                  <p className={`mt-2 text-xs font-semibold leading-relaxed ${darkConsole ? "text-white/45" : "text-muted"}`}>
                    Сейчас можно сгенерировать до {remainingGenerations}{" "}
                    {remainingGenerations === 1 ? "карточку" : "карточки"}.
                  </p>
                ) : null}
                {!kitModeActive && cardsCount > 1 ? (
                  <div className="mt-4 grid gap-3">
                    <p className={`text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      {KIT_SERIES_DESCRIPTION}. Выбрано{" "}
                      <span className="font-semibold text-accent-ink">{plannedGenerationCount}</span> карточек в серии.
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
                    Нужно {plannedGenerationCount} пробных карточек, доступно {remainingGenerations}.{" "}
                    <button
                      className="font-semibold underline-offset-2 hover:underline"
                      onClick={() => openPaywall("series")}
                      type="button"
                    >
                      Купить комплект
                    </button>
                  </p>
                ) : null}
              </div>
              <details
                className={`group rounded-[14px] border ${darkConsole ? "border-white/10 bg-white/[0.03]" : "border-clay bg-paper"}`}
                onToggle={(event) => setExtraDetailsOpen((event.target as HTMLDetailsElement).open)}
                open={extraDetailsOpen}
              >
                <summary
                  className={`cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none ${labelClass}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="grid gap-0.5">
                      <span>Характеристики товара</span>
                      <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        цвет, размер, состав — если есть под рукой
                      </span>
                    </span>
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
                      onChange={(event) => setTextMode(normalizeTextMode(event.target.value))}
                      value={textMode}
                      variant={selectVariant}
                    >
                      {CARD_TEXT_MODES.map((item) => (
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
                  <span className="grid gap-0.5">
                    Название товара
                    <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                      Проверьте перед генерацией — пойдёт в WB/Ozon и на слайды
                    </span>
                  </span>
                  <Input
                    onChange={(event) => setProductName(event.target.value)}
                    placeholder="Воздушный шар в виде восклицательного знака"
                    required
                    value={productName}
                  />
                </label>
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  <span className="grid gap-0.5">
                    Заголовок на обложке
                    {persistToServer ? (
                      <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        Можно пустым — возьмём название товара
                      </span>
                    ) : null}
                  </span>
                  <Input
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="Как на карточке"
                    value={headline}
                  />
                </label>
              </div>
              <div className={`grid gap-4 md:grid-cols-2 ${darkConsole ? "" : ""}`}>
                <label className={`grid gap-2 text-sm font-semibold md:col-span-2 ${labelClass}`}>
                  <span className="grid gap-0.5">
                    Вид карточки
                    {persistToServer ? (
                      <span className={`text-xs font-normal ${darkConsole ? "text-white/40" : "text-muted"}`}>
                        Сколько плашек и текста на картинке
                      </span>
                    ) : null}
                  </span>
                  <Select
                    onChange={(event) => {
                      const nextDesignPreset = event.target.value as ImageDesignPreset;
                      setDesignPreset(nextDesignPreset);
                      reachGoal("select_design_preset", { designPreset: nextDesignPreset });
                    }}
                    value={designPreset}
                    variant={selectVariant}
                  >
                    {CARD_DESIGN_PRESETS.map((item) => (
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
                <p className={`text-sm font-semibold ${darkConsole ? "text-accent-ink" : "text-accent-ink"}`}>
                  {seriesProgress}
                </p>
              ) : null}
              {persistToServer && remainingGenerations !== null && !isLoading ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted">
                    {hasUnlimitedAccess || remainingGenerations >= 999_000 ? (
                      <>
                        Баланс: <span className="text-accent-ink">безлимитные серии</span>
                      </>
                    ) : downloadPolicy?.downloadsFullyUnlocked ? (
                      <>
                        Серия оплачена:{" "}
                        <span className="text-accent-ink">{remainingGenerations} слайдов без водяного знака</span>
                      </>
                    ) : (
                      <>
                        Осталось генераций: <span className="text-accent-ink">{remainingGenerations}</span>
                      </>
                    )}
                  </p>
                  {!hasUnlimitedAccess && remainingGenerations < 999_000 ? (
                    <p className="text-xs font-semibold text-muted">{formatMonthlyFreeResetHint(monthlyFreeResetsAt)}</p>
                  ) : null}
                </div>
              ) : null}
              <div className={`flex flex-col gap-2 border-t pt-3 sm:flex-row sm:flex-wrap sm:gap-3 ${darkConsole ? "border-white/10" : "border-clay"}`}>
                <Button
                  className={`w-full sm:w-auto ${GENERATE_BUTTON_CLASS}`}
                  disabled={
                    isWorking ||
                    (persistToServer && remainingGenerations === 0) ||
                    selectedCountExceedsQuota
                  }
                  type="submit"
                >
                  {isWorking ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                  {compactDemoEntry
                    ? isWorking
                      ? "Генерируем демо…"
                      : "Сгенерировать демо"
                    : isWorking
                    ? kitModeActive
                      ? "Генерируем серию…"
                      : plannedGenerationCount > 1
                        ? "Генерируем серию…"
                        : "Генерируем…"
                    : kitModeActive
                      ? `Сгенерировать серию (${plannedGenerationCount})`
                      : plannedGenerationCount > 1
                        ? `Сгенерировать ${plannedGenerationCount} карточек`
                        : layoutTemplateCard
                          ? "Сгенерировать ещё 1 по шаблону"
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
                      1 демо с водяным знаком без входа. Серия инфографики для одного товара — в платном комплекте.
                    </p>
                    <a className="mt-1 inline-flex text-sm font-black text-accent-ink underline-offset-4 hover:underline" href="/#pricing">
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
                    <Button
                      className="w-full sm:w-auto"
                      disabled={!canDownloadCurrentCard}
                      onClick={handleDownloadBestImage}
                      variant="dark"
                    >
                      Скачать PNG
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => openCardEditor(card)} type="button" variant="secondary">
                      <Pencil size={16} />
                      Редактировать
                    </Button>
                  </div>
                </div>
                {hasAiCover ? (
                  <NanoBananaRetentionNotice className="mt-4" variant={darkConsole ? "dark" : "default"} />
                ) : null}
                <div className={`relative mt-4 overflow-hidden rounded-card border ${previewFrameClass} ${darkConsole ? "border-white/10 bg-ink-soft" : "border-clay bg-paper"}`}>
                  {isGeneratingAiImage ? (
                    <div className="grid aspect-[4/5] max-h-[360px] place-items-center gap-4 px-6">
                      <Loader2 className="animate-spin text-muted" size={28} />
                      <p className="text-center text-sm font-medium text-muted">Создаём обложку…</p>
                    </div>
                  ) : hasAiCover && card ? (
                    <GeneratedCoverPreview
                      alt="Готовая обложка"
                      card={card}
                      className={`aspect-[4/5] w-full ${embedded ? "object-contain" : "object-cover"}`}
                      displayCard={displayCard}
                      reloadToken={previewReloadToken}
                    />
                  ) : card.generatedImageIsFallback ? (
                    <ImageGenerationRetryCallout
                      className="h-full min-h-[280px] justify-center border-0 bg-transparent p-4 sm:min-h-[320px] sm:p-8"
                      darkConsole={darkConsole}
                      disabled={isWorking}
                      embedded
                      onRecover={
                        card.generationId || extractProviderGenerationId(card.generatedImageError)
                          ? handleRecoverImageCover
                          : undefined
                      }
                      onRetry={handleRetryImageCover}
                    />
                  ) : isRenderingImage ? (
                    <div className="grid aspect-[4/5] max-h-[360px] place-items-center">
                      <SkeletonBlock className="h-full w-full rounded-none" />
                    </div>
                  ) : (
                    <GeneratedCardPreview
                      card={displayCard ?? card}
                      compact={embedded}
                      imageUrl={imageUrl || card.imageDataUrl}
                      ref={previewRef}
                      styleName={style}
                    />
                  )}
                  {displayCard?.watermarkLocked && hasAiCover ? <WatermarkOverlay /> : null}
                </div>
                {displayCard?.watermarkLocked && hasAiCover && persistToServer ? (
                  <div className="mt-3 grid gap-2">
                    <p className={`text-xs font-semibold ${darkConsole ? "text-white/55" : "text-muted"}`}>
                      Пробная карточка с водяным знаком. Скачать без метки — в комплекте.
                    </p>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => openPaywall("quota_exhausted")}
                      size="sm"
                      type="button"
                      variant="dark"
                    >
                      {KIT_UNLOCK_CTA}
                    </Button>
                  </div>
                ) : downloadPolicy?.downloadsFullyUnlocked && hasAiCover && persistToServer ? (
                  <p className={`mt-3 text-xs font-semibold ${darkConsole ? "text-emerald-300/90" : "text-emerald-700"}`}>
                    Серия оплачена. Скачивание без водяного знака доступно.
                  </p>
                ) : null}
                {showKitOfferAfterGeneration && persistToServer ? (
                  <div className="mt-4">
                    <KitOfferBanner
                      darkConsole={darkConsole}
                      onBuyClick={() => openPaywall("quota_exhausted")}
                      showPaymentButton
                    />
                  </div>
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
                    <p className={`mt-1 text-sm font-semibold ${darkConsole ? "text-accent-ink" : "text-accent-ink"}`}>
                      Готово {seriesReadyCount} из {seriesCards.length}
                      {seriesFailedCount > 0 ? ` · ошибка ${seriesFailedCount}` : ""}
                    </p>
                    <p className={`mt-1 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
                      Слайды одного товара с разными смысловыми блоками.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seriesFailedCount > 0 ? (
                      <Button
                        disabled={isWorking}
                        onClick={() => void handleRegenerateMissingSeriesCards()}
                        size="sm"
                        variant="secondary"
                      >
                        <Wand2 size={16} />
                        Проверить недостающие у провайдера
                      </Button>
                    ) : null}
                    <Button
                      disabled={seriesReadyCount < 1}
                      onClick={handleDownloadSeriesZip}
                      size="sm"
                      variant="dark"
                    >
                      <Archive size={16} />
                      {seriesReadyCount > 0
                        ? `Скачать готовые ${seriesReadyCount} ${seriesReadyCount === 1 ? "слайд" : "слайда"} ZIP`
                        : "Скачать ZIP"}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {displaySeriesCards.map((seriesCard, index) => {
                    const rawSeriesCard = seriesCards.find((item) => item.id === seriesCard.id) ?? seriesCard;
                    const previewReady = hasGeneratedAiCover(rawSeriesCard) || hasGeneratedAiCover(seriesCard);
                    const itemError = seriesCard.generatedImageError;

                    return (
                      <div
                        className={`rounded-[16px] border p-3 ${
                          previewReady
                            ? darkConsole
                              ? "border-white/10 bg-black/10"
                              : "border-clay bg-paper"
                            : darkConsole
                              ? "border-amber-300/30 bg-amber-300/5 opacity-90"
                              : "border-amber-200 bg-amber-50/60"
                        }`}
                        key={seriesCard.id}
                      >
                        <button className="block w-full text-left" onClick={() => openCardEditor(seriesCard)} type="button">
                          <div className={`overflow-hidden rounded-[12px] border ${darkConsole ? "border-white/10" : "border-clay"}`}>
                            {previewReady ? (
                              <div className="relative">
                                <GeneratedCoverPreview
                                  alt={seriesCard.title}
                                  card={rawSeriesCard}
                                  className="aspect-[4/5] w-full object-cover"
                                  displayCard={seriesCard}
                                  reloadToken={previewReloadToken}
                                />
                                {seriesCard.watermarkLocked ? <WatermarkOverlay /> : null}
                              </div>
                            ) : (
                              <div className="grid aspect-[3/2] place-items-center px-4 text-center text-sm font-semibold text-muted">
                                {itemError ? "Не удалось сгенерировать" : "Карточка готовится"}
                              </div>
                            )}
                          </div>
                          <p className={`mt-3 text-xs font-black uppercase tracking-[0.16em] ${darkConsole ? "text-accent-ink" : "text-accent-ink"}`}>
                            {String(seriesCard.seriesIndex ?? index + 1).padStart(2, "0")} · {seriesCard.seriesPlanItem?.title || "Карточка"}
                          </p>
                          <p className={`mt-1 line-clamp-2 text-sm font-semibold ${darkConsole ? "text-white" : "text-ink"}`}>
                            {seriesCard.title}
                          </p>
                          {itemError ? <p className="mt-2 text-xs font-semibold text-red-400">{itemError}</p> : null}
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {previewReady ? (
                            <>
                              <Button
                                disabled={!canDownloadCardImage(seriesCard, downloadPolicy, persistToServer)}
                                onClick={() => handleDownloadSeriesCard(seriesCard, index)}
                                size="sm"
                                variant="secondary"
                              >
                                <Download size={15} />
                                PNG
                              </Button>
                              <Button onClick={() => openCardEditor(seriesCard)} size="sm" variant="ghost">
                                <Pencil size={15} />
                                Редактировать
                              </Button>
                            </>
                          ) : (
                            <Button
                              disabled={isWorking}
                              onClick={() => void handleRecoverSeriesCard(seriesCard)}
                              size="sm"
                              variant="secondary"
                            >
                              <RefreshCcw size={15} />
                              Проверить у провайдера
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {!embedded && card ? (
              <ResultPanel
                canDownload={canDownloadCurrentCard}
                card={card}
                compact={embedded}
                dark={darkConsole}
                onDownloadPng={() => downloadPreviewPng(previewRef.current, card?.title)}
                onDownloadSeriesZip={seriesReadyCount > 0 ? handleDownloadSeriesZip : undefined}
                onSave={handleSave}
                previewRef={previewRef}
                seriesReadyCount={seriesReadyCount}
              />
            ) : null}
          </div>
          ) : null}
          {embedded && showPreviewColumn && card ? (
            <ResultPanel
              canDownload={canDownloadCurrentCard}
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

async function downloadCardImage(card: ProductCardResult, fileName: string) {
  const result = await downloadCardImageAsset(card, fileName);

  if (result.blocked) {
    throw new Error("DOWNLOAD_LOCKED");
  }

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

  if (remoteResult.blocked) {
    throw new Error("DOWNLOAD_LOCKED");
  }

  if (!remoteResult.missing) {
    return;
  }

  if (card.watermarkLocked && !card.downloadUnlocked) {
    // Prefer server watermarked preview; don't fall through to clean base64.
    throw new Error("DOWNLOAD_LOCKED");
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

function ImageGenerationRetryCallout({
  className = "",
  darkConsole = false,
  disabled = false,
  embedded = false,
  onRecover,
  onRetry
}: {
  className?: string;
  darkConsole?: boolean;
  disabled?: boolean;
  embedded?: boolean;
  onRecover?: () => void;
  onRetry: () => void;
}) {
  const panelClass = darkConsole
    ? "border-amber-300/45 bg-amber-300/12 text-white"
    : "border-amber-300 bg-amber-50 text-ink";
  const hintClass = darkConsole ? "text-white/80" : "text-ink/75";
  const reassuranceClass = darkConsole ? "text-accent-ink" : "text-accent-ink";

  return (
    <div
      className={`flex flex-col items-center rounded-[20px] border-2 px-4 py-5 text-center shadow-[0_12px_40px_rgba(251,191,36,0.14)] sm:px-6 sm:py-6 ${panelClass} ${className}`.trim()}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-300/25 text-amber-200">
        <WifiOff size={28} strokeWidth={2.2} />
      </div>
      <p className={`mt-4 text-lg font-black leading-snug sm:text-xl ${darkConsole ? "text-white" : "text-ink"}`}>
        Ошибка связи с интернетом
      </p>
      <p className={`mt-2 max-w-sm text-sm font-semibold leading-relaxed sm:text-base ${hintClass}`}>
        Картинка обычно уже готова у провайдера — сначала подтянем её.{" "}
        <span className={reassuranceClass}>Новую генерацию не запускаем.</span>
      </p>
      <div className={`mt-5 flex w-full max-w-sm flex-col gap-2 ${embedded ? "" : "sm:w-auto"}`}>
        <Button
          className="w-full shadow-[0_10px_30px_rgba(155,255,141,0.35)]"
          disabled={disabled}
          onClick={onRecover || onRetry}
          size="lg"
          type="button"
          variant="primary"
        >
          <RefreshCcw size={18} />
          Проверить у провайдера
        </Button>
      </div>
    </div>
  );
}
