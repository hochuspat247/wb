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
      const message = caught instanceof Error ? caught.message : "Не получилось создать карточку.";
      setError(message);
      setIsGenerating(false);
      setDemoProgress(0);
      trackMarketingEvent("hero_demo_generate_error", { message });
    }
  }

  const canGenerate = Boolean(imageUrl && description.trim());

  if (isGenerating) {
    return (
      <div className="scroll-mt-24 rounded-[24px] border border-clay bg-card p-5 shadow-soft md:p-7" id="hero-mini-generator">
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
    <div className="scroll-mt-24 rounded-[24px] border border-clay bg-card p-5 shadow-soft md:p-7" id="hero-mini-generator">
      <form className="grid gap-5" id="demo" onSubmit={handleSubmit}>
        <div>
          <p className="text-lg font-black text-ink">Попробуйте на своём товаре</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">
            1 демо-карточка без входа. Оригинал и дополнительные карточки доступны после авторизации.
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
              <img alt="Загруженное фото товара" className="aspect-[4/5] max-h-56 w-full object-cover" src={imageUrl} />
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
              className={`grid gap-3 rounded-[18px] border border-dashed p-6 text-center transition focus-visible:outline-none ${
                isDragging ? "border-accent bg-accent/10" : "border-clay bg-paper hover:border-accent/60 hover:bg-accent/5"
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
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent">
                <ImageUp size={22} />
              </span>
              <span className="text-base font-black text-ink">Загрузите фото товара</span>
              <span className="text-sm font-semibold text-muted">Перетащите изображение сюда или нажмите, чтобы выбрать файл</span>
              <span className="text-xs font-semibold text-muted/80">JPG или PNG, до 10 МБ</span>
            </button>
          )}
        </div>

        <label className="grid gap-2 text-sm font-bold text-ink">
          Описание товара
          <Textarea
            onChange={(event) => handleDescriptionChange(event.target.value)}
            placeholder="Например: беспроводные наушники, чёрные, с кейсом"
            rows={3}
            value={description}
          />
        </label>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="grid gap-3">
          <Button className="w-full py-3.5" disabled={!canGenerate} type="submit">
            <Wand2 size={17} />
            Сгенерировать демо
          </Button>
          <p className="text-center text-xs font-semibold text-muted">Без входа · без карты · результат с водяным знаком</p>
        </div>

        <div className="border-t border-clay pt-4">
          <p className="text-sm font-bold text-ink">Или попробуйте на примере</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {heroDemoExamples.map((example) => (
              <button
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  selectedExampleId === example.id
                    ? "border-accent bg-accent/15 text-ink"
                    : "border-clay bg-paper text-muted hover:border-accent/50 hover:text-ink"
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
      </form>
    </div>
  );
}
