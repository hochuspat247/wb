"use client";

import { Download, Film, RotateCcw } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Button } from "@/components/ui/Button";

type VideoReadyScreenProps = {
  videoUrl: string;
  orderId: string;
  onCreateAnother: () => void;
  onBackToCard: () => void;
  compact?: boolean;
};

export function VideoReadyScreen({
  videoUrl,
  orderId,
  onCreateAnother,
  onBackToCard,
  compact
}: VideoReadyScreenProps) {
  return (
    <div
      className={
        compact
          ? "min-w-0"
          : "min-w-0 overflow-hidden rounded-[24px] border border-clay bg-card p-4 sm:p-6 md:p-8"
      }
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Готово</p>
      <h3 className={`mt-2 font-black text-ink ${compact ? "text-xl" : "mt-3 text-2xl"}`}>Видео готово 🎬</h3>
      <p className="mt-2 text-sm font-medium text-muted">
        Скачайте ролик и используйте его в рекламе, соцсетях или карточке товара.
      </p>

      <div className="mx-auto mt-5 w-full max-w-[280px] overflow-hidden rounded-[16px] border border-clay bg-black">
        <video className="aspect-[4/5] w-full object-contain" controls playsInline src={videoUrl} />
      </div>

      <div className="mt-5 grid gap-2">
        <Button
          className="w-full"
          onClick={() => {
            trackMarketingEvent("video_download", { orderId });
            window.open(`/api/video/orders/${orderId}/download`, "_blank");
          }}
          type="button"
        >
          <Download size={16} />
          Скачать видео
        </Button>
        <Button className="w-full" onClick={onCreateAnother} type="button" variant="secondary">
          <Film size={16} />
          Создать ещё видео
        </Button>
        <Button className="w-full" onClick={onBackToCard} type="button" variant="ghost">
          <RotateCcw size={16} />
          Вернуться к карточке
        </Button>
      </div>
    </div>
  );
}
