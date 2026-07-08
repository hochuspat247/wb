"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, Trash2, Wand2 } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { detectCategory } from "@/lib/category";
import { heroDemoExamples, loadExampleImageDataUrl } from "@/lib/hero/demoExamples";
import { toUserFacingError } from "@/lib/api/parseJsonResponse";
import { HERO_DEMO_LOADING_STATUSES, HERO_DEMO_MIN_LOADING_MS, submitHeroDemo } from "@/lib/hero/submitHeroDemo";
import { HERO_IMAGE_MAX_BYTES, resizeImageToDataUrl, validateImageFile } from "@/lib/image";
import { marketplaceLabelToPlatform } from "@/lib/marketplace/utils";

export function HeroMiniGenerator() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadViewTrackedRef = useRef(false);
  const descriptionStartedRef = useRef(false);
  const descriptionFilledRef = useRef(false);

  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoStatusIndex, setDemoStatusIndex] = useState(0);
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);

  useEffect(() => {
    if (uploadViewTrackedRef.current) return;
    uploadViewTrackedRef.current = true;
    trackMarketingEvent("hero_upload_zone_view");
  }, []);

  useEffect(() => {
    if (!isGenerating) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(95, Math.round((elapsed / 55_000) * 95));
      const statusIndex = Math.min(HERO_DEMO_LOADING_STATUSES.length - 1, Math.floor(elapsed / 5_500));
      setDemoProgress(progress);
      setDemoStatusIndex(statusIndex);
    }, 450);

    return () => window.clearInterval(timer);
  }, [isGenerating]);

  async function applyFile(file?: File) {
    if (!file) return;

    trackMarketingEvent("hero_file_selected", {
      fileType: file.type,
      fileSize: file.size
    });

    const validationError = validateImageFile(file, HERO_IMAGE_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      setImageUrl("");
      setImageFileName("");
      return;
    }

    setError("");
    setSelectedExampleId(null);
    setImageFileName(file.name);

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setImageUrl(dataUrl);
      trackMarketingEvent("photo_uploaded", {
        fileType: file.type,
        fileSize: file.size,
        source: "hero"
      });
    } catch {
      setError("Не удалось прочитать изображение.");
    }
  }

  async function handleExampleSelect(exampleId: string) {
    const example = heroDemoExamples.find((item) => item.id === exampleId);
    if (!example) return;

    trackMarketingEvent("hero_example_selected", { exampleId });

    try {
      setError("");
      setSelectedExampleId(exampleId);
      setDescription(example.description);
      setImageFileName(`${example.label}.jpg`);
      const dataUrl = await loadExampleImageDataUrl(example.image);
      setImageUrl(dataUrl);

      if (!descriptionFilledRef.current) {
        descriptionFilledRef.current = true;
        trackMarketingEvent("hero_description_filled", { source: "example" });
      }
    } catch {
      setError("Не удалось подставить пример. Попробуйте загрузить своё фото.");
    }
  }

  function handleDescriptionChange(value: string) {
    setDescription(value);

    if (!descriptionStartedRef.current && value.length > 0) {
      descriptionStartedRef.current = true;
      trackMarketingEvent("hero_description_started");
    }

    if (!descriptionFilledRef.current && value.trim().length >= 3) {
      descriptionFilledRef.current = true;
      trackMarketingEvent("hero_description_filled", { source: "manual" });
    }
  }

  function clearImage() {
    setImageUrl("");
    setImageFileName("");
    setSelectedExampleId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!imageUrl) {
      setError("Загрузите фото товара — без него обложка не получится.");
      return;
    }

    if (!description.trim()) {
      setError("Опишите товар — хотя бы в двух словах.");
      return;
    }

    trackMarketingEvent("hero_demo_generate_click", {
      hasExample: Boolean(selectedExampleId)
    });
    trackMarketingEvent("demo_generation_started", {
      source: "hero",
      hasImage: Boolean(imageUrl)
    });

    const startedAt = Date.now();
    setIsGenerating(true);
    setDemoProgress(0);
    setDemoStatusIndex(0);

    try {
      const category = detectCategory(description);
      const { generationId, guestId } = await submitHeroDemo({
        imageUrl,
        payload: {
          productDescription: description,
          category,
          marketplace: "Wildberries",
          style: "Премиальный",
          includeSeo: true,
          focusBenefits: true,
          includeInfographicText: true,
          imageFileName,
          platform: marketplaceLabelToPlatform("Wildberries"),
          textMode: "marketplace_safe"
        }
      });

      const remainingDelay = Math.max(0, HERO_DEMO_MIN_LOADING_MS - (Date.now() - startedAt));
      await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
      setDemoProgress(100);

      trackMarketingEvent("hero_demo_generate_success", { generationId });
      trackMarketingEvent("demo_generation_completed", { generationId, source: "hero" });
      router.push(`/generations/${generationId}?guestId=${encodeURIComponent(guestId)}`);
    } catch (caught) {
      const message = toUserFacingError(caught);
      setError(message);
      setIsGenerating(false);
      setDemoProgress(0);
      trackMarketingEvent("hero_demo_generate_error", { message });
    }
  }

  const canGenerate = Boolean(imageUrl && description.trim());
  const submitLabel = !imageUrl
    ? "Загрузите фото, чтобы продолжить"
    : !description.trim()
      ? "Добавьте описание товара"
      : "Сгенерировать демо";

  if (isGenerating) {
    return (
      <div className="anchor-section scroll-mt-[96px] rounded-[20px] border border-clay bg-card p-4 shadow-soft md:p-5" id="hero-mini-generator">
        <div className="py-6 text-center md:py-10">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
            <Loader2 className="animate-spin" size={28} />
          </div>
          <h2 className="text-2xl font-black text-ink md:text-3xl">Создаём вашу демо-карточку</h2>
          <p className="mt-3 text-sm font-semibold text-muted">Обычно это занимает около минуты</p>
          <div className="mt-7 overflow-hidden rounded-full bg-ink/10">
            <div className="h-2.5 rounded-full bg-accent transition-all duration-500" style={{ width: `${demoProgress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold md:text-sm">
            <span className="text-muted">{HERO_DEMO_LOADING_STATUSES[demoStatusIndex]}</span>
            <span className="text-accent">{demoProgress}%</span>
          </div>
          {error ? (
            <div className="mt-5">
              <Alert variant="error">{error}</Alert>
              <Button className="mt-4" onClick={() => setIsGenerating(false)} type="button">
                Попробовать снова
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="anchor-section scroll-mt-[96px] rounded-[20px] border border-clay bg-card p-4 shadow-soft md:p-5" id="hero-mini-generator">
      <form className="grid gap-3" id="demo" onSubmit={handleSubmit}>
        <div>
          <p className="text-base font-black text-ink md:text-[17px]">Попробуйте на своём товаре</p>
          <p className="mt-0.5 text-xs font-semibold leading-snug text-muted md:text-sm">
            1 демо без входа. Оригинал и дополнительные карточки — после авторизации.
          </p>
          <p className="mt-2 rounded-[14px] border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-bold leading-relaxed text-ink md:text-sm">
            Нужна карусель из нескольких фото и карточек товара?{" "}
            <a className="text-accent underline-offset-4 hover:underline" href="/#pricing">
              Выберите пакет
            </a>{" "}
            и соберите серию для WB/Ozon в кабинете.
          </p>
        </div>

        <div className="grid gap-2">
          <input
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => applyFile(event.target.files?.[0])}
            ref={fileInputRef}
            type="file"
          />

          {imageUrl ? (
            <div className="relative overflow-hidden rounded-[18px] border border-clay bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Загруженное фото товара" className="aspect-[4/5] max-h-44 w-full object-cover" src={imageUrl} />
              <button
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-clay bg-card/95 text-ink transition hover:text-accent"
                onClick={clearImage}
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              className={`grid gap-1.5 rounded-[18px] border-2 border-dashed px-4 py-5 text-center transition focus-visible:outline-none ${
                isDragging
                  ? "border-accent bg-accent/10 shadow-[0_0_0_4px_rgba(124,255,107,0.12)]"
                  : "border-clay/90 bg-gradient-to-b from-accent/[0.06] via-paper to-paper hover:border-accent/50 hover:from-accent/[0.1]"
              }`}
              data-hero-upload
              onClick={() => {
                trackMarketingEvent("hero_upload_click");
                fileInputRef.current?.click();
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                trackMarketingEvent("hero_upload_click", { method: "drop" });
                applyFile(event.dataTransfer.files?.[0]);
              }}
              type="button"
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/20">
                <ImageUp size={20} />
              </span>
              <span className="text-base font-black text-ink">Загрузите фото товара</span>
              <span className="mx-auto max-w-[260px] text-xs font-semibold leading-snug text-muted md:text-sm">
                AI уберёт фон, подберёт стиль и соберёт демо-карточку
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted/75">JPG или PNG, до 10 МБ</span>
            </button>
          )}
        </div>

        <label className="grid gap-1.5 text-sm font-bold text-ink">
          Описание товара
          <Textarea
            className="min-h-[72px] py-2.5 text-sm"
            onChange={(event) => handleDescriptionChange(event.target.value)}
            placeholder="Например: беспроводные наушники, чёрные, с кейсом"
            rows={2}
            value={description}
          />
        </label>

        <div className="rounded-[14px] border border-clay/80 bg-paper/50 px-3 py-2.5">
          <p className="text-xs font-bold text-ink md:text-sm">Нет фото под рукой? Попробуйте пример:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {heroDemoExamples.map((example) => (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition md:text-sm ${
                  selectedExampleId === example.id
                    ? "border-accent bg-accent/15 text-ink"
                    : "border-clay bg-card text-muted hover:border-accent/50 hover:text-ink"
                }`}
                key={example.id}
                onClick={() => handleExampleSelect(example.id)}
                type="button"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="grid gap-2 pt-0.5">
          <Button className="w-full py-3" disabled={!canGenerate} type="submit">
            <Wand2 size={17} />
            {submitLabel}
          </Button>
          <p className="text-center text-xs font-semibold text-muted">Без входа · без карты · демо с защитной меткой</p>
        </div>
      </form>
    </div>
  );
}
