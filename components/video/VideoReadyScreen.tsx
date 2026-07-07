"use client";

import { Download, Film, RotateCcw } from "lucide-react";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Button } from "@/components/ui/Button";

type VideoReadyScreenProps = {
  videoUrl: string;
  orderId: string;
  onCreateAnother: () => void;
  onBackToCard: () => void;
};

export function VideoReadyScreen({ videoUrl, orderId, onCreateAnother, onBackToCard }: VideoReadyScreenProps) {
  return (
    <div className="rounded-[24px] border border-clay bg-card p-6 md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Готово</p>
      <h3 className="mt-3 text-2xl font-black text-ink">Видео готово 🎬</h3>
      <p className="mt-2 text-sm font-medium text-muted">
        Скачайте ролик и используйте его в рекламе, соцсетях или карточке товара.
      </p>

      <div className="mt-6 overflow-hidden rounded-[18px] border border-clay bg-ink">
        <video className="aspect-[4/5] max-h-[560px] w-full bg-black object-contain" controls src={videoUrl} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1"
          onClick={() => {
            trackMarketingEvent("video_download", { orderId });
            window.open(`/api/video/orders/${orderId}/download`, "_blank");
          }}
          type="button"
        >
          <Download size={16} />
          Скачать видео
        </Button>
        <Button className="flex-1" onClick={onCreateAnother} type="button" variant="secondary">
          <Film size={16} />
          Создать ещё видео
        </Button>
        <Button className="flex-1" onClick={onBackToCard} type="button" variant="ghost">
          <RotateCcw size={16} />
          Вернуться к карточке
        </Button>
      </div>
    </div>
  );
}
