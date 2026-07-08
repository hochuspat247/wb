"use client";

import { Download, Film } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Button } from "@/components/ui/Button";
import { getCardGeneratedVideos } from "@/lib/cardVideos";
import type { ProductCardResult } from "@/types/product-card";

type CardSavedVideosPanelProps = {
  card: ProductCardResult;
  compact?: boolean;
};

export function CardSavedVideosPanel({ card, compact }: CardSavedVideosPanelProps) {
  const videos = getCardGeneratedVideos(card);

  if (!videos.length) {
    return null;
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4 rounded-[18px] border border-clay bg-paper/40 p-4"}>
      <div>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-accent">
          <Film size={14} />
          Сохранённые видео
        </p>
        <p className="mt-1 text-sm text-muted">
          {videos.length === 1 ? "1 ролик привязан к этой карточке" : `${videos.length} ролика привязаны к этой карточке`}
        </p>
      </div>

      <div className="grid gap-4">
        {videos.map((video, index) => (
          <div className="grid gap-3 rounded-[16px] border border-clay bg-card p-3 sm:grid-cols-[140px_1fr]" key={video.orderId}>
            <div className="overflow-hidden rounded-[12px] border border-clay bg-black">
              <video className="aspect-[4/5] w-full object-contain" controls playsInline preload="metadata" src={video.url} />
            </div>
            <div className="flex min-w-0 flex-col justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  {videos.length > 1 ? `Видео ${videos.length - index}` : "Видео из карточки"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {video.duration ? `${video.duration} сек` : "—"}
                  {video.quality ? ` · ${video.quality}` : ""}
                  {video.generateAudio ? " · со звуком" : " · без звука"}
                  {video.model ? ` · ${video.model}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">{new Date(video.createdAt).toLocaleString("ru-RU")}</p>
              </div>
              {video.orderId !== "legacy" ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    trackMarketingEvent("video_download", { orderId: video.orderId });
                    window.open(`/api/video/orders/${video.orderId}/download`, "_blank");
                  }}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Download size={14} />
                  Скачать MP4
                </Button>
              ) : (
                <Button className="w-full sm:w-auto" onClick={() => window.open(video.url, "_blank")} size="sm" type="button" variant="secondary">
                  <Download size={14} />
                  Открыть видео
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
