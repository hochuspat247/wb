"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  Camera,
  Copy,
  Download,
  ImagePlus,
  LayoutGrid,
  Loader2,
  MapPin,
  Sparkles,
  Video,
  Wand2,
  X,
  FolderOpen
} from "lucide-react";
import { KvartovidPlatformTextsSection } from "@/components/kvartovid/KvartovidPlatformTextsSection";
import { KvartovidFloorPlanSection } from "@/components/kvartovid/KvartovidFloorPlanSection";
import { KvartovidListingPhotosGallery } from "@/components/kvartovid/KvartovidListingPhotosGallery";
import { KvartovidQuotaNotice } from "@/components/kvartovid/KvartovidQuotaNotice";
import { KvartovidPaymentPanel } from "@/components/kvartovid/KvartovidPaymentPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  generateKvartovidListing,
  createKvartovidVideoOrder,
  fetchKvartovidQuota,
  fetchVideoOrderStatus,
  KvartovidApiError
} from "@/lib/api/kvartovid";
import { KVARTOVID_GENERATION_ERROR, toUserFacingError } from "@/lib/api/parseJsonResponse";
import { dataUrlToBase64, resizeImageToDataUrl, validateImageFile } from "@/lib/image";
import { BRAND } from "@/lib/branding";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import { formatPlatformTextsForExport } from "@/lib/kvartovid/platformTexts";
import type { KvartovidDealType, KvartovidListingResult, KvartovidPropertyType } from "@/types/kvartovid";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;

function FormSection({
  step,
  icon: Icon,
  title,
  description,
  children
}: {
  step: number;
  icon: typeof Building2;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm font-bold text-amber-400">
            {step}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-amber-400" />
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
          </div>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function OptionPill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
          : "border-white/10 text-muted hover:border-amber-500/25 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function AiOptionCard({
  checked,
  onChange,
  icon: Icon,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: typeof Camera;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
        checked
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-amber-500/20"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-amber-500"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-amber-400" />
          {title}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      </div>
    </label>
  );
}

type PhotoPreview = {
  id: string;
  name: string;
  previewUrl: string;
  base64: string;
  mimeType: string;
};

async function fileToPhoto(file: File): Promise<PhotoPreview> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const dataUrl = await resizeImageToDataUrl(file, 1600);
  const { base64, mimeType } = dataUrlToBase64(dataUrl);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    previewUrl: dataUrl,
    base64,
    mimeType
  };
}

export function KvartovidCreateForm() {
  const router = useRouter();
  const { status } = useSession();
  const [quota, setQuota] = useState<Awaited<ReturnType<typeof fetchKvartovidQuota>>>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [dealType, setDealType] = useState<KvartovidDealType>("sale");
  const [propertyType, setPropertyType] = useState<KvartovidPropertyType>("apartment");
  const [rooms, setRooms] = useState("2");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [metro, setMetro] = useState("");
  const [renovation, setRenovation] = useState("");
  const [extraFeatures, setExtraFeatures] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [includeCover, setIncludeCover] = useState(true);
  const [includeFloorPlan, setIncludeFloorPlan] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<KvartovidListingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [videoAspect, setVideoAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoResult, setVideoResult] = useState<{ videoUrl: string; orderId: string } | null>(null);

  const exportText = useMemo(() => {
    if (!result) return "";
    const lines = [
      "=== Универсальная версия ===",
      result.title,
      "",
      result.description,
      "",
      "Преимущества:",
      ...result.advantages.map((item) => `• ${item}`),
      "",
      formatPlatformTextsForExport(result.platformTexts)
    ];
    return lines.join("\n").trim();
  }, [result]);

  useEffect(() => {
    if (status !== "authenticated") {
      setQuota(null);
      return;
    }

    setQuotaLoading(true);
    void fetchKvartovidQuota()
      .then(setQuota)
      .catch(() => setQuota(null))
      .finally(() => setQuotaLoading(false));
  }, [status]);

  const canGenerate = quota?.canGenerate !== false;

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const nextFiles = files.slice(0, remaining);
    setError("");

    try {
      const nextPhotos = await Promise.all(nextFiles.map(fileToPhoto));
      setPhotos((prev) => [...prev, ...nextPhotos].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото.");
    } finally {
      e.target.value = "";
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleHighlight(item: string) {
    setSelectedHighlights((prev) =>
      prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item].slice(0, 6)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (photos.length < MIN_PHOTOS) {
      setError(`Загрузите минимум ${MIN_PHOTOS} фото.`);
      return;
    }
    if (!city.trim()) {
      setError("Укажите город.");
      return;
    }
    if (!area || Number(area) <= 0) {
      setError("Укажите площадь в м².");
      return;
    }

    setLoading(true);
    setVideoResult(null);
    setVideoError("");

    try {
      const data = await generateKvartovidListing({
        dealType,
        propertyType,
        rooms: rooms.trim(),
        area: Number(area),
        floor: floor ? Number(floor) : undefined,
        totalFloors: totalFloors ? Number(totalFloors) : undefined,
        price: price.trim() || undefined,
        city: city.trim(),
        district: district.trim() || undefined,
        metro: metro.trim() || undefined,
        renovation: renovation.trim() || undefined,
        extraFeatures: extraFeatures.trim() || undefined,
        photos: photos.map((p) => ({ base64: p.base64, mimeType: p.mimeType, name: p.name })),
        selectedHighlights: selectedHighlights.length ? selectedHighlights : undefined,
        includeCover,
        includeFloorPlan
      });

      setResult(data);
      setQuota(data.quota ?? quota);
      if (data.suggestedHighlights?.length && !selectedHighlights.length) {
        setSelectedHighlights(data.advantages.slice(0, 4));
      }
    } catch (err) {
      if (err instanceof KvartovidApiError) {
        if (err.message.includes("401") || err.message.includes("Войдите")) {
          router.push(`/register?callbackUrl=${encodeURIComponent("/kvartovid/create")}`);
          return;
        }
        if (err.code === "QUOTA_EXCEEDED") {
          setQuota(err.quota ?? quota);
          setError(err.message);
          return;
        }
        setError(err.message);
        return;
      }

      const e = err as Error;
      if (e.message.includes("401") || e.message.includes("Войдите")) {
        router.push(`/register?callbackUrl=${encodeURIComponent("/kvartovid/create")}`);
        return;
      }
      setError(toUserFacingError(e, KVARTOVID_GENERATION_ERROR));
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCover() {
    if (result?.coverImageBase64) {
      const mime = result.coverImageMimeType || "image/png";
      const link = document.createElement("a");
      link.href = `data:${mime};base64,${result.coverImageBase64}`;
      link.download = "kvartovid-cover.png";
      link.click();
      return;
    }

    if (result?.coverImageUrl) {
      window.open(result.coverImageUrl, "_blank", "noopener,noreferrer");
    }
  }

  const coverPreviewSrc = useMemo(() => {
    if (!result) return null;
    if (result.coverImageBase64) {
      return `data:${result.coverImageMimeType || "image/png"};base64,${result.coverImageBase64}`;
    }
    return result.coverImageUrl ?? null;
  }, [result]);

  async function handleGenerateVideo() {
    if (!result) return;

    const sourcePhoto = photos[result.bestPhotoIndex] ?? photos[0];
    const imageBase64 = result.coverImageBase64 ?? sourcePhoto?.base64;
    const imageMimeType = result.coverImageMimeType ?? sourcePhoto?.mimeType;

    if (!imageBase64 || !imageMimeType) {
      setVideoError("Нужно фото квартиры или обложка для видео.");
      return;
    }

    setVideoLoading(true);
    setVideoError("");
    setVideoResult(null);

    try {
      const order = await createKvartovidVideoOrder({
        title: result.title,
        description: result.description,
        advantages: result.advantages,
        city: city.trim(),
        rooms: rooms.trim(),
        area: Number(area) || undefined,
        propertyType,
        renovation: renovation.trim() || undefined,
        extraFeatures: extraFeatures.trim() || undefined,
        imageBase64,
        imageMimeType,
        duration: "8",
        aspectRatio: videoAspect,
        quality: "standard",
        motionStyle: "premium_parallax"
      });

      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
        return;
      }

      const startedAt = Date.now();
      let status = await fetchVideoOrderStatus(order.orderId);

      while (Date.now() - startedAt < 180_000) {
        if (status.status === "done" && status.originalVideoUrl) {
          setVideoResult({ videoUrl: status.originalVideoUrl, orderId: order.orderId });
          return;
        }

        if (status.status === "error") {
          throw new Error(status.error || "Видео не удалось сгенерировать.");
        }

        if (status.status === "payment_pending") {
          throw new Error("Оплата видео не завершена.");
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
        status = await fetchVideoOrderStatus(order.orderId);
      }

      throw new Error("Видео ещё генерируется. Проверьте статус позже в кабинете.");
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Не удалось сгенерировать видео.");
    } finally {
      setVideoLoading(false);
    }
  }

  function downloadText() {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kvartovid-obyavlenie.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {status === "authenticated" && !quotaLoading ? (
        <>
          <KvartovidQuotaNotice quota={quota} />
          {!canGenerate ? <KvartovidQuotaNotice quota={quota} variant="blocked" /> : null}
          <KvartovidPaymentPanel quota={quota} />
        </>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          step={1}
          icon={Camera}
          title="Фото квартиры"
          description={`Загрузите от ${MIN_PHOTOS} до ${MAX_PHOTOS} фото: комнаты, кухня, санузел, двор.`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                photos.length >= MIN_PHOTOS
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border border-white/10 bg-white/5 text-muted"
              }`}
            >
              {photos.length} / {MAX_PHOTOS} фото
            </span>
            {photos.length < MIN_PHOTOS ? (
              <span className="text-xs text-amber-300">Ещё {MIN_PHOTOS - photos.length}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#0a1210]/50"
              >
                <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-100 transition hover:bg-red-500/90 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Удалить фото"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/25 bg-amber-500/[0.04] text-muted transition hover:border-amber-500/45 hover:bg-amber-500/10 hover:text-amber-300">
                <ImagePlus className="h-6 w-6 text-amber-400" />
                <span className="text-xs font-medium">Добавить фото</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotosChange} />
              </label>
            ) : null}
          </div>
        </FormSection>

        <FormSection step={2} icon={Building2} title="Параметры объекта">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Тип сделки</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(DEAL_TYPE_LABELS) as [KvartovidDealType, string][]).map(([value, label]) => (
                  <OptionPill key={value} active={dealType === value} onClick={() => setDealType(value)}>
                    {label}
                  </OptionPill>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Тип жилья</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.entries(PROPERTY_TYPE_LABELS) as [KvartovidPropertyType, string][]).map(([value, label]) => (
                  <OptionPill key={value} active={propertyType === value} onClick={() => setPropertyType(value)}>
                    {label}
                  </OptionPill>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Комнат</label>
              <Input value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="2" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Площадь, м²</label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="54" inputMode="decimal" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Этаж</label>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="5" inputMode="numeric" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Этажей в доме</label>
              <Input value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} placeholder="17" inputMode="numeric" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Цена</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12 500 000 ₽" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Город *</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Москва" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Район</label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Сокольники" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Метро</label>
              <Input value={metro} onChange={(e) => setMetro(e.target.value)} placeholder="Сокольники, 7 мин" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">Ремонт</label>
              <Input value={renovation} onChange={(e) => setRenovation(e.target.value)} placeholder="Свежий ремонт 2024" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                Дополнительно
              </label>
              <Textarea
                value={extraFeatures}
                onChange={(e) => setExtraFeatures(e.target.value)}
                placeholder="Балкон, парковка, можно с животными..."
                rows={3}
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-ink">Дополнительные материалы</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AiOptionCard
                checked={includeCover}
                onChange={setIncludeCover}
                icon={Sparkles}
                title="AI-обложка"
                description="Продающая обложка для карточки объявления через NanoBanana Expert."
              />
              <AiOptionCard
                checked={includeFloorPlan}
                onChange={setIncludeFloorPlan}
                icon={LayoutGrid}
                title="Схема планировки"
                description="Интерактивный чертёж по параметрам квартиры — можно подправить в конструкторе."
              />
            </div>
            <p className="text-xs text-muted">
              Планировка — схематический чертёж, не план БТИ. После генерации её можно отредактировать.
            </p>
          </div>
        </FormSection>

        {selectedHighlights.length > 0 || result?.suggestedHighlights?.length ? (
          <FormSection
            step={3}
            icon={Sparkles}
            title="Что подсветить"
            description="Выберите только правдивые пункты — они попадут в текст объявления."
          >
            <div className="flex flex-wrap gap-2">
              {(result?.suggestedHighlights ?? selectedHighlights).map((item) => {
                const active = selectedHighlights.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleHighlight(item)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-amber-500 bg-amber-500/15 text-amber-300"
                        : "border-white/15 text-muted hover:border-amber-500/30"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </FormSection>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        ) : null}

        <div className="sticky bottom-4 z-10 rounded-2xl border border-amber-500/20 bg-[#060d0b]/95 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <Button
          type="submit"
          size="lg"
          disabled={loading || !canGenerate}
          className="w-full !border-amber-500 !bg-amber-500 !text-black hover:!bg-amber-400 sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Генерируем объявление…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Сгенерировать объявление
            </>
          )}
        </Button>
        </div>
      </form>

      {result ? (
        <div className="space-y-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/8 to-transparent p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Результат</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">Готовое объявление</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {typeof result.qualityScore === "number" ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
                  Готовность: {result.qualityScore}/100
                </span>
              ) : null}
              {result.listingId ? (
                <Link
                  href={`/kvartovid/cabinet?listing=${result.listingId}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition hover:text-amber-300"
                >
                  <FolderOpen className="h-4 w-4" />
                  Открыть в кабинете
                </Link>
              ) : null}
            </div>
          </div>

          <KvartovidListingPhotosGallery
            bestPhotoIndex={result.bestPhotoIndex}
            coverError={result.coverImageError}
            coverProvider={result.coverImageProvider}
            coverSrc={coverPreviewSrc}
            photos={photos.map((photo) => ({ previewUrl: photo.previewUrl, name: photo.name }))}
            watermarkLocked={result.watermarkLocked}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0a1210]/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Заголовок</p>
              <p className="mt-2 text-lg font-bold leading-snug text-ink">{result.title}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0a1210]/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Преимущества</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {result.advantages.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1210]/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Универсальное описание</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{result.description}</p>
          </div>

          {result.platformTexts?.length ? (
            <KvartovidPlatformTextsSection platformTexts={result.platformTexts} />
          ) : null}

          {result.floorPlanSvg ? (
            <KvartovidFloorPlanSection
              bestPhotoIndex={result.bestPhotoIndex}
              error={result.floorPlanError}
              layout={result.floorPlanLayout}
              listingId={result.listingId}
              photoPreviews={photos.map((photo) => ({ previewUrl: photo.previewUrl, name: photo.name }))}
              resetKey={result.generatedAt}
              svg={result.floorPlanSvg}
              watermarkLocked={result.watermarkLocked}
              onChange={({ layout, svg }) =>
                setResult((prev) => (prev ? { ...prev, floorPlanLayout: layout, floorPlanSvg: svg } : prev))
              }
            />
          ) : null}

          {result.qualityTips?.length ? (
            <div className="rounded-xl border border-white/10 bg-[#0a1210]/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Советы до публикации</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {result.qualityTips.map((tip) => (
                  <li key={tip}>+ {tip}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={copyText}>
              <Copy className="h-4 w-4" />
              {copied ? "Скопировано" : "Копировать текст"}
            </Button>
            <Button type="button" variant="secondary" onClick={downloadText}>
              <Download className="h-4 w-4" />
              Скачать текст
            </Button>
            {coverPreviewSrc ? (
              <Button type="button" variant="secondary" onClick={downloadCover}>
                <Download className="h-4 w-4" />
                {result.watermarkLocked ? "Скачать обложку (DEMO)" : "Скачать обложку"}
              </Button>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a1210]/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Видео из фото квартиры</p>
                <p className="mt-1 text-xs text-muted">
                  {BRAND.googleVeo} {BRAND.veoVersion} Fast через GenAPI — как в {BRAND.marketCardShort} и {BRAND.storyStudio}.
                </p>
              </div>
              <select
                value={videoAspect}
                onChange={(e) => setVideoAspect(e.target.value as "9:16" | "16:9" | "1:1")}
                className="rounded-xl border border-white/10 bg-[#060d0b] px-3 py-2 text-sm text-ink"
              >
                <option value="9:16">9:16 — Stories/Reels</option>
                <option value="16:9">16:9 — реклама</option>
                <option value="1:1">1:1 — соцсети</option>
              </select>
            </div>
            <Button
              type="button"
              className="mt-4 !border-emerald-500 !bg-emerald-600 !text-white hover:!bg-emerald-500"
              disabled={videoLoading || !result || !photos.length}
              onClick={handleGenerateVideo}
            >
              {videoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Генерируем видео…
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  Сгенерировать видео
                </>
              )}
            </Button>
            {!coverPreviewSrc && result ? (
              <p className="mt-2 text-xs text-muted">Видео соберётся из лучшего исходного фото, если обложка не сгенерировалась.</p>
            ) : null}
            {videoError ? <p className="mt-3 text-sm text-red-300">{videoError}</p> : null}
            {videoResult?.videoUrl ? (
              <video
                src={videoResult.videoUrl}
                controls
                className="mt-4 max-h-96 w-full rounded-xl border border-white/10 bg-black"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
