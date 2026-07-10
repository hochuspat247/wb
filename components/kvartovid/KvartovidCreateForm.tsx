"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, ImagePlus, Loader2, Video, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { generateKvartovidListing, createKvartovidVideoOrder, fetchVideoOrderStatus } from "@/lib/api/kvartovid";
import { BRAND } from "@/lib/branding";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import type { KvartovidDealType, KvartovidListingResult, KvartovidPropertyType } from "@/types/kvartovid";

const MIN_PHOTOS = 3;
const MAX_PHOTOS = 10;

type PhotoPreview = {
  id: string;
  name: string;
  previewUrl: string;
  base64: string;
  mimeType: string;
};

async function fileToPhoto(file: File): Promise<PhotoPreview> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const previewUrl = URL.createObjectURL(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    previewUrl,
    base64,
    mimeType: file.type
  };
}

export function KvartovidCreateForm() {
  const router = useRouter();
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
      result.title,
      "",
      result.description,
      "",
      "Преимущества:",
      ...result.advantages.map((item) => `• ${item}`)
    ];
    return lines.join("\n");
  }, [result]);

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const nextFiles = files.slice(0, remaining);
    const nextPhotos = await Promise.all(nextFiles.map(fileToPhoto));
    setPhotos((prev) => [...prev, ...nextPhotos].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
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
        includeCover
      });

      setResult(data);
      if (data.suggestedHighlights?.length && !selectedHighlights.length) {
        setSelectedHighlights(data.advantages.slice(0, 4));
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.message.includes("401") || e.message.includes("Войдите")) {
        router.push(`/register?callbackUrl=${encodeURIComponent("/kvartovid/create")}`);
        return;
      }
      if (e.code === "QUOTA_EXCEEDED") {
        setError("Бесплатные генерации закончились. Купите пакет в кабинете.");
        return;
      }
      setError(e.message || "Не удалось сгенерировать объявление.");
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-ink">Фото квартиры</h2>
          <p className="mt-1 text-sm text-muted">Загрузите от {MIN_PHOTOS} до {MAX_PHOTOS} фото: комнаты, кухня, санузел, двор.</p>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 text-muted transition hover:border-amber-500/40 hover:text-amber-400">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Добавить</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotosChange} />
              </label>
            ) : null}
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-ink">Параметры объекта</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Тип сделки</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value as KvartovidDealType)}
                className="w-full rounded-xl border border-white/10 bg-[#0a1210] px-3 py-2.5 text-sm text-ink"
              >
                {Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Тип жилья</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as KvartovidPropertyType)}
                className="w-full rounded-xl border border-white/10 bg-[#0a1210] px-3 py-2.5 text-sm text-ink"
              >
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
              <label className="mb-1.5 block text-sm font-medium text-ink">Дополнительно</label>
              <Textarea
                value={extraFeatures}
                onChange={(e) => setExtraFeatures(e.target.value)}
                placeholder="Балкон, парковка, можно с животными..."
                rows={3}
              />
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeCover}
              onChange={(e) => setIncludeCover(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-500"
            />
            Сгенерировать AI-обложку (NanoBanana Expert)
          </label>
          <p className="mt-2 text-xs text-muted">
            Обложка генерируется через NanoBanana Expert — как карточки товаров в {BRAND.marketCardShort}.
          </p>
        </div>

        {selectedHighlights.length > 0 || result?.suggestedHighlights?.length ? (
          <div className="rounded-card border border-white/10 bg-card/80 p-6">
            <h2 className="text-lg font-semibold text-ink">Что подсветить (выберите правдивые пункты)</h2>
            <div className="mt-3 flex flex-wrap gap-2">
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
          </div>
        ) : null}

        {error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
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
      </form>

      {result ? (
        <div className="space-y-6 rounded-card border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Готовое объявление</h2>
            {typeof result.qualityScore === "number" ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
                Готовность: {result.qualityScore}/100
              </span>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Заголовок</p>
            <p className="mt-1 text-lg font-bold text-ink">{result.title}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Описание</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{result.description}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Преимущества</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {result.advantages.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          {coverPreviewSrc ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">AI-обложка</p>
                {result.coverImageProvider ? (
                  <span className="text-xs text-muted">{result.coverImageProvider}</span>
                ) : null}
              </div>
              <img
                src={coverPreviewSrc}
                alt="Обложка объявления"
                className="mt-3 max-h-80 w-full rounded-xl border border-white/10 object-cover"
              />
            </div>
          ) : result.coverImageError ? (
            <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{result.coverImageError}</p>
          ) : null}

          {result.qualityTips?.length ? (
            <div>
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
                Скачать обложку
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

          <p className="text-xs text-muted">
            Варианты текста под Авито, Циан и Домклик отдельно — в следующем релизе.{" "}
            <Link href="/kvartovid#features" className="text-amber-400 hover:underline">
              Смотреть roadmap
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
