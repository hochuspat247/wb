"use client";

import { Film, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import {
  VIDEO_RESULT_UPSELL_DURATION_LABEL,
  VIDEO_RESULT_UPSELL_PRICE_LABEL
} from "@/lib/marketing/videoUpsell";

const PROMINENT_CTA_CLASS =
  "bg-[linear-gradient(135deg,#BFF93F_0%,#D4FF6B_48%,#ADFC00_100%)] text-on-accent ring-2 ring-accent/40 shadow-[0_0_0_4px_rgba(191,249,63,0.18),0_14px_36px_rgba(191,249,63,0.24)] hover:bg-[linear-gradient(135deg,#D4FF6B_0%,#BFF93F_52%,#E8FF8A_100%)] hover:ring-accent/55";

type CreateVideoFromCardBlockProps = {
  onCreateClick: () => void;
  disabled?: boolean;
  darkConsole?: boolean;
  prominent?: boolean;
};

export function CreateVideoFromCardBlock({
  onCreateClick,
  disabled,
  darkConsole,
  prominent = false
}: CreateVideoFromCardBlockProps) {
  if (process.env.NEXT_PUBLIC_VIDEO_GENERATION_ENABLED === "false") {
    return null;
  }

  function handleClick() {
    trackMarketingEvent("video_create_click", { source: prominent ? "result_upsell" : "result_block" });
    onCreateClick();
  }

  if (prominent) {
    return (
      <div
        className={`mt-5 rounded-[22px] border p-4 sm:p-5 ${
          darkConsole
            ? "border-accent/35 bg-[linear-gradient(180deg,rgba(124,255,107,0.16)_0%,rgba(124,255,107,0.06)_100%)] shadow-[0_18px_48px_rgba(124,255,107,0.12)]"
            : "border-accent/30 bg-[linear-gradient(180deg,rgba(124,255,107,0.14)_0%,rgba(124,255,107,0.05)_100%)] shadow-[0_18px_48px_rgba(124,255,107,0.1)]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
              darkConsole ? "bg-accent/20 text-accent-ink" : "bg-accent/15 text-accent-ink"
            }`}
          >
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-lg font-black leading-snug sm:text-xl ${darkConsole ? "text-white" : "text-ink"}`}>
              Оживите эту карточку в видео за {VIDEO_RESULT_UPSELL_PRICE_LABEL}
            </p>
            <p className={`mt-2 text-sm leading-relaxed ${darkConsole ? "text-white/65" : "text-muted"}`}>
              Получите короткий ролик {VIDEO_RESULT_UPSELL_DURATION_LABEL} для рекламы, соцсетей и карточки товара.
            </p>
          </div>
        </div>
        <Button className={`mt-4 w-full ${PROMINENT_CTA_CLASS}`} disabled={disabled} onClick={handleClick} type="button">
          <Film size={17} />
          Создать видео из этой карточки
        </Button>
      </div>
    );
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
            Оживите эту карточку в видео за {VIDEO_RESULT_UPSELL_PRICE_LABEL}
          </p>
          <p className={`mt-1 text-sm leading-relaxed ${darkConsole ? "text-white/50" : "text-muted"}`}>
            Получите короткий ролик {VIDEO_RESULT_UPSELL_DURATION_LABEL} для рекламы, соцсетей и карточки товара.
          </p>
        </div>
        <Button className="w-full" disabled={disabled} onClick={handleClick} type="button" variant="secondary">
          Создать видео из этой карточки
        </Button>
      </div>
    </div>
  );
}
