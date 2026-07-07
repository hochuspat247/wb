"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { calculateVideoPriceRub, formatVideoPriceRub } from "@/config/video-pricing";
import { createVideoOrder } from "@/lib/api/video";
import { getGeneratedCoverSrc } from "@/lib/image";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { ProductCardResult } from "@/types/product-card";
import type {
  VideoAspectRatio,
  VideoDuration,
  VideoMotionStyle,
  VideoQuality
} from "@/types/video-generation";

const motionStyleOptions: Array<{ value: VideoMotionStyle; label: string }> = [
  { value: "soft_zoom", label: "Мягкий zoom" },
  { value: "premium_parallax", label: "Premium parallax" },
  { value: "light_sweep", label: "Light sweep" },
  { value: "marketplace_motion", label: "Marketplace motion" }
];

type VideoConfigModalProps = {
  open: boolean;
  card: ProductCardResult;
  videoCredits: number;
  onClose: () => void;
  onOrderCreated: (orderId: string, options?: { usedVideoCredit?: boolean }) => void;
};

export function VideoConfigModal({ open, card, videoCredits, onClose, onOrderCreated }: VideoConfigModalProps) {
  const [duration, setDuration] = useState<VideoDuration>("5");
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>("4:5");
  const [quality, setQuality] = useState<VideoQuality>("standard");
  const [motionStyle, setMotionStyle] = useState<VideoMotionStyle>("premium_parallax");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = getGeneratedCoverSrc(card) || card.imageDataUrl;
  const amountRub = useMemo(() => calculateVideoPriceRub(duration, quality), [duration, quality]);
  const canUseCredit = videoCredits > 0;

  useEffect(() => {
    if (open) {
      trackMarketingEvent("video_modal_open", { cardId: card.id });
    }
  }, [open, card.id]);

  if (!open) return null;

  async function handleSubmit(useVideoCredit = false) {
    setLoading(true);
    setError("");

    try {
      trackMarketingEvent(useVideoCredit ? "video_order_created" : "video_payment_started", {
        duration,
        quality,
        aspectRatio
      });

      const result = await createVideoOrder({
        sourceGenerationId: card.id,
        duration,
        aspectRatio,
        quality,
        motionStyle,
        useVideoCredit
      });

      trackMarketingEvent("video_order_created", { orderId: result.orderId });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      if (result.usedVideoCredit) {
        trackMarketingEvent("video_payment_success", { orderId: result.orderId, usedVideoCredit: true });
        trackMarketingEvent("video_generation_started", { orderId: result.orderId });
      }

      onOrderCreated(result.orderId, { usedVideoCredit: result.usedVideoCredit });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось создать заказ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-clay bg-card p-6 shadow-soft md:p-8">
        <button
          aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Kling Video O3</p>
        <h3 className="mt-3 text-2xl font-black text-ink">Видео из вашей карточки</h3>
        <p className="mt-2 text-sm font-medium text-muted">
          Мы анимируем уже готовую карточку, сохранив товар, текст, цвета и композицию.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-[16px] border border-clay bg-paper">
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Превью карточки" className="aspect-[4/5] w-full object-cover" src={previewSrc} />
            ) : (
              <div className="grid aspect-[4/5] place-items-center text-sm text-muted">Нет превью</div>
            )}
          </div>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Длительность
              <Select onChange={(e) => setDuration(e.target.value as VideoDuration)} value={duration}>
                <option value="5">5 секунд</option>
                <option value="10">10 секунд</option>
              </Select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Формат
              <Select onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)} value={aspectRatio}>
                <option value="4:5">4:5</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
              </Select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Качество
              <Select onChange={(e) => setQuality(e.target.value as VideoQuality)} value={quality}>
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
              </Select>
            </label>

            <label className="grid gap-1.5 text-xs font-semibold text-muted">
              Стиль движения
              <Select onChange={(e) => setMotionStyle(e.target.value as VideoMotionStyle)} value={motionStyle}>
                {motionStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] border border-clay bg-paper/50 px-4 py-4">
          <p className="text-sm font-black text-ink">Стоимость: {formatVideoPriceRub(amountRub)}</p>
          {canUseCredit ? (
            <p className="mt-1 text-xs font-semibold text-muted">Доступно video-credits: {videoCredits}</p>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {canUseCredit ? (
            <Button className="flex-1" disabled={loading} onClick={() => void handleSubmit(true)} type="button">
              {loading ? <Loader2 className="animate-spin" size={16} /> : null}
              Списать 1 видео и создать
            </Button>
          ) : null}
          <Button
            className="flex-1"
            disabled={loading}
            onClick={() => void handleSubmit(false)}
            type="button"
            variant={canUseCredit ? "secondary" : "primary"}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Оплатить и создать видео
          </Button>
        </div>
      </div>
    </div>
  );
}
