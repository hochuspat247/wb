"use client";

import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { KvartovidDemoBanner } from "@/components/kvartovid/KvartovidDemoBanner";
import { KvartovidProtectedMedia } from "@/components/kvartovid/KvartovidProtectedMedia";

type PhotoItem = {
  previewUrl: string;
  name?: string;
};

type Props = {
  photos: PhotoItem[];
  bestPhotoIndex: number;
  coverSrc?: string | null;
  coverProvider?: string;
  coverError?: string;
  watermarkLocked?: boolean;
};

export function KvartovidListingPhotosGallery({
  photos,
  bestPhotoIndex,
  coverSrc,
  coverProvider,
  coverError,
  watermarkLocked = false
}: Props) {
  if (!photos.length) {
    return null;
  }

  const safeBestIndex = Math.min(Math.max(bestPhotoIndex, 0), photos.length - 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#0f1714] via-[#0a1210] to-[#121c18] p-4 sm:p-5">
      {watermarkLocked ? <KvartovidDemoBanner compact /> : null}

      <div className={`flex flex-wrap items-center justify-between gap-2 ${watermarkLocked ? "mt-4" : ""}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Фото объекта</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted">
          {photos.length} фото
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          {coverSrc ? (
            <KvartovidProtectedMedia
              locked={watermarkLocked}
              className="group overflow-hidden rounded-2xl border border-amber-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              <img
                src={coverSrc}
                alt="AI-обложка объявления"
                className="aspect-[3/2] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                draggable={!watermarkLocked}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
              <div className="absolute left-3 top-3 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-black">
                AI-обложка
              </div>
              {coverProvider ? (
                <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
                  {coverProvider}
                </div>
              ) : null}
            </KvartovidProtectedMedia>
          ) : coverError ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-6 text-sm text-amber-100">
              {coverError}
            </div>
          ) : (
            <KvartovidProtectedMedia locked={watermarkLocked} className="overflow-hidden rounded-2xl border border-white/10">
              <img
                src={photos[safeBestIndex]?.previewUrl}
                alt={photos[safeBestIndex]?.name || "Главное фото"}
                className="aspect-[4/3] w-full object-cover"
                draggable={!watermarkLocked}
              />
              <div className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black">
                Главное фото
              </div>
            </KvartovidProtectedMedia>
          )}

          <p className="text-xs leading-relaxed text-muted">
            {watermarkLocked
              ? "Это пробная версия: DEMO на всех фото. Оплатите тариф, чтобы скачать обложку и фото без водяного знака."
              : coverSrc
                ? "Обложка собрана из лучшего кадра. Ниже — все загруженные фото для публикации на площадках."
                : "Лучший кадр выбран автоматически. Все загруженные фото — в галерее справа."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {photos.map((photo, index) => {
            const isBest = index === safeBestIndex;

            return (
              <KvartovidProtectedMedia
                key={`${photo.previewUrl}-${index}`}
                locked={watermarkLocked}
                className={`group overflow-hidden rounded-xl ${
                  isBest ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0a1210]" : "border border-white/10"
                }`}
              >
                <img
                  src={photo.previewUrl}
                  alt={photo.name || `Фото ${index + 1}`}
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  draggable={!watermarkLocked}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-2 left-2 z-10 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {index + 1} / {photos.length}
                </span>
                {isBest ? (
                  <span className="absolute left-2 top-2 z-10 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    {coverSrc ? "Источник обложки" : "Лучшее"}
                  </span>
                ) : null}
              </KvartovidProtectedMedia>
            );
          })}
        </div>
      </div>
    </div>
  );
}
