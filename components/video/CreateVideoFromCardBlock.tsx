"use client";

import { Film } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { VIDEO_GENERATION_START_PRICE_RUB, formatVideoPriceRub } from "@/lib/pricing";

type CreateVideoFromCardBlockProps = {
  onCreateClick: () => void;
  disabled?: boolean;
  darkConsole?: boolean;
};

export function CreateVideoFromCardBlock({ onCreateClick, disabled, darkConsole }: CreateVideoFromCardBlockProps) {
  if (process.env.NEXT_PUBLIC_VIDEO_GENERATION_ENABLED === "false") {
    return null;
  }

  return (
    <div
      className={`mt-4 rounded-[18px] border p-4 ${
        darkConsole ? "border-white/10 bg-black/10" : "border-clay bg-paper/60"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <p className={`flex items-center gap-2 text-sm font-black ${darkConsole ? "text-white" : "text-ink"}`}>
            <Film size={16} />
            Оживите карточку в видео
          </p>
          <p className={`mt-1 text-sm leading-relaxed ${darkConsole ? "text-white/50" : "text-muted"}`}>
            Создадим короткий ролик из этой карточки: плавный zoom, parallax, мягкая подсветка товара и аккуратное
            движение.
          </p>
          <p className={`mt-2 text-xs font-semibold ${darkConsole ? "text-white/40" : "text-muted/80"}`}>
            Видео создаётся отдельно после оплаты — от {formatVideoPriceRub(VIDEO_GENERATION_START_PRICE_RUB)} за 4 сек.
            Всегда без звука.
          </p>
        </div>
        <Button
          className="w-full"
          disabled={disabled}
          onClick={() => {
            trackMarketingEvent("video_create_click");
            onCreateClick();
          }}
          type="button"
          variant="secondary"
        >
          Создать видео из карточки
        </Button>
      </div>
    </div>
  );
}
