"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FileImage, ImageUp, Loader2, RotateCcw, Wand2 } from "lucide-react";
import { GeneratedCardPreview } from "@/components/GeneratedCardPreview";
import { HistorySection } from "@/components/HistorySection";
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
import { createPreviewPngDataUrl, downloadPreviewPng } from "@/lib/download";
import { base64ToDataUrl, dataUrlToBase64, downloadBase64Image, downloadImageFromUrl, validateImageFile } from "@/lib/image";
import { clearHistory, getHistory, removeFromHistory, saveToHistory } from "@/lib/storage";
import { saveUserCardRemote } from "@/lib/api/user";
import type {
  GenerateImageResult,
  ImageDesignPreset,
  ImageGenerationMode,
  ProductCardInput,
  ProductCardResult
} from "@/types/product-card";

const marketplaces = ["Wildberries", "Ozon", "Avito", "Яндекс Маркет"];
const styles = ["Минималистичный", "Премиальный", "Яркий", "Нежный", "Технологичный"];

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

export function CardGenerator({
  hideHistory = false,
  onSaved,
  embedded = false,
  persistToServer = false,
  darkConsole = false
}: {
  hideHistory?: boolean;
  onSaved?: () => void;
  embedded?: boolean;
  persistToServer?: boolean;
  darkConsole?: boolean;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [marketplace, setMarketplace] = useState("Wildberries");
  const [style, setStyle] = useState("Премиальный");
  const [headline, setHeadline] = useState("");
  const [price, setPrice] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [designPreset, setDesignPreset] = useState<ImageDesignPreset>("premium-marketplace");
  const [imageMode, setImageMode] = useState<ImageGenerationMode>("pro");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [card, setCard] = useState<ProductCardResult | null>(null);
  const [history, setHistory] = useState<ProductCardResult[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState("");
  const [isRenderingImage, setIsRenderingImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const effectiveCategory = useMemo(() => detectCategory(description, category), [category, description]);

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
          setNotice("Карточка готова. Нажмите «Скачать изображение», чтобы сохранить файл.");
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!description.trim()) {
      setError("Опишите товар — хотя бы в двух словах.");
      return;
    }

    if (!imageUrl) {
      setError("Загрузите фото товара — без него обложка не получится.");
      return;
    }

    if (removeBackground) {
      await handleBackgroundRemoval();
    }

    setIsLoading(true);
    const payload: ProductCardInput = {
      productDescription: description,
      category: effectiveCategory,
      marketplace,
      style,
      includeSeo: true,
      focusBenefits: true,
      includeInfographicText: true,
      imageFileName
    };

    try {
      const response = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать карточку. Попробуйте ещё раз.");
      }

      const generatedCard: ProductCardResult = {
        ...(data as ProductCardResult),
        benefits: Array.isArray((data as ProductCardResult).benefits) ? (data as ProductCardResult).benefits : [],
        keywords: Array.isArray((data as ProductCardResult).keywords) ? (data as ProductCardResult).keywords : [],
        infographicTexts: Array.isArray((data as ProductCardResult).infographicTexts) ? (data as ProductCardResult).infographicTexts : [],
        imageDataUrl: imageUrl || undefined,
        headline: headline.trim() || undefined,
        price: price.trim() || undefined,
        ctaText: ctaText.trim() || undefined,
        designPreset
      };
      setCard(generatedCard);
      setNotice("Создаём обложку…");
      await generateAiMarketplaceImage(generatedCard);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать карточку. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setDescription("");
    setCategory("");
    setMarketplace("Wildberries");
    setStyle("Премиальный");
    setHeadline("");
    setPrice("");
    setCtaText("");
    setDesignPreset("premium-marketplace");
    setImageMode("pro");
    setRemoveBackground(false);
    setImageUrl("");
    setImageFileName("");
    setCard(null);
    setRenderedImageUrl("");
    setError("");
    setNotice("");
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
    setNotice("Карточка сохранена.");
  }

  function handleOpenHistory(cardFromHistory: ProductCardResult) {
    setCard(cardFromHistory);
    setMarketplace(cardFromHistory.marketplace);
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

  async function generateAiMarketplaceImage(cardForImage: ProductCardResult) {
    const productImage = imageUrl || cardForImage.imageDataUrl;

    if (!productImage) {
      setNotice("Тексты готовы. Загрузите фото, чтобы создать обложку.");
      return;
    }

    setIsGeneratingAiImage(true);

    try {
      const image = dataUrlToBase64(productImage);
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: description,
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
          outputFormat: "png"
        })
      });
      const data = (await response.json()) as GenerateImageResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать обложку.");
      }

      applyImageResult(cardForImage, data);

      if (data.isFallback || (!data.imageUrl && !data.imageBase64)) {
        setNotice("Тексты и превью готовы. Обложку можно скачать кнопкой ниже.");
        return;
      }

      setNotice("Готово! Скачайте карточку и загрузите на маркетплейс.");
    } catch {
      setNotice("Тексты готовы. Превью обложки можно скачать кнопкой ниже.");
    } finally {
      setIsGeneratingAiImage(false);
    }
  }

  const displayImageUrl =
    card?.generatedImageUrl ||
    (card?.generatedImageBase64 && card.generatedImageMimeType
      ? base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType)
      : card?.generatedImageDataUrl) ||
    renderedImageUrl;

  const hasAiCover = Boolean(
    card &&
    !isGeneratingAiImage &&
    !card.generatedImageIsFallback &&
    (card.generatedImageUrl || (card.generatedImageBase64 && card.generatedImageMimeType))
  );

  const isWorking = isLoading || isGeneratingAiImage || isRenderingImage;
  const labelClass = darkConsole ? "text-white/80" : "text-ink";
  const formClass = darkConsole
    ? "rounded-card border border-white/10 bg-white/5 p-5 md:p-6"
    : "rounded-card border border-clay bg-card p-5 md:p-6";
  const panelClass = darkConsole
    ? "rounded-card border border-white/10 bg-white/5 p-5"
    : "rounded-card border border-clay bg-card p-5";

  return (
    <section className={embedded ? "" : "relative py-24"} id={embedded ? undefined : "demo"}>
      <div className={embedded ? undefined : "section-shell"}>
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form className={formClass} onSubmit={handleSubmit}>
            <div className="grid gap-5">
              <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                <span>Фото товара</span>
                <div className={`rounded-xl border border-dashed p-4 ${darkConsole ? "border-white/20 bg-white/5" : "border-clay bg-paper"}`}>
                  <Input accept="image/*" onChange={(event) => handleImage(event.target.files?.[0])} type="file" />
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                    <ImageUp size={15} />
                    {imageFileName || "JPG или PNG, до 10 МБ"}
                  </div>
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
                  <Select onChange={(event) => setMarketplace(event.target.value)} value={marketplace}>
                    {marketplaces.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`grid gap-2 text-sm font-semibold ${labelClass}`}>
                  Стиль
                  <Select onChange={(event) => setStyle(event.target.value)} value={style}>
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
              <div className={`rounded-xl border p-4 ${darkConsole ? "border-white/10 bg-white/5" : "border-clay bg-paper"}`}>
                <h4 className={`text-sm font-semibold ${labelClass}`}>Дополнительные поля</h4>
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
                      onChange={(event) => setDesignPreset(event.target.value as ImageDesignPreset)}
                      value={designPreset}
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
              <div className="flex flex-wrap gap-3">
                <Button disabled={isWorking} type="submit">
                  {isWorking ? <Loader2 className="animate-spin" size={17} /> : <Wand2 size={17} />}
                  {isWorking ? "Генерируем…" : "Сгенерировать карточку"}
                </Button>
                <Button onClick={handleClear} type="button" variant="secondary">
                  <RotateCcw size={17} />
                  Очистить
                </Button>
              </div>
            </div>
          </form>
          <div className="grid gap-6">
            <div className={hasAiCover ? "sr-only" : undefined}>
              <GeneratedCardPreview
                card={card}
                generatedImageUrl={card?.generatedImageUrl || card?.generatedImageDataUrl}
                imageUrl={imageUrl || card?.imageDataUrl}
                ref={previewRef}
                styleName={style}
              />
            </div>
            {isWorking && !card ? (
              <div className={panelClass}>
                <p className={`mb-4 text-sm font-semibold ${darkConsole ? "text-white/70" : "text-muted"}`}>
                  Подготавливаем карточку…
                </p>
                <SkeletonBlock className="aspect-[4/5] w-full" />
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
                  <Button onClick={() => downloadBestImage(card, renderedImageUrl, previewRef.current)} variant="dark">
                    Скачать PNG
                  </Button>
                </div>
                <div className={`mt-4 overflow-hidden rounded-card border ${darkConsole ? "border-white/10 bg-ink-soft" : "border-clay bg-paper"}`}>
                  {isGeneratingAiImage ? (
                    <div className="grid aspect-[4/5] place-items-center gap-4 px-6">
                      <Loader2 className="animate-spin text-muted" size={28} />
                      <p className="text-center text-sm font-medium text-muted">Создаём обложку…</p>
                    </div>
                  ) : isRenderingImage && !card.generatedImageUrl && !card.generatedImageDataUrl ? (
                    <div className="grid aspect-[4/5] place-items-center">
                      <SkeletonBlock className="h-full w-full rounded-none" />
                    </div>
                  ) : displayImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Готовая обложка"
                      className="aspect-[4/5] w-full object-contain transition duration-300 hover:scale-[1.01]"
                      src={displayImageUrl}
                    />
                  ) : (
                    <div className="grid aspect-[4/5] place-items-center px-6 text-center text-sm font-medium text-muted">
                      Базовая обложка 4:5 появится после генерации
                    </div>
                  )}
                </div>
              </div>
            ) : !isWorking ? (
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
            <ResultPanel card={card} dark={darkConsole} onDownloadPng={() => downloadPreviewPng(previewRef.current, card?.title)} onSave={handleSave} previewRef={previewRef} />
          </div>
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
