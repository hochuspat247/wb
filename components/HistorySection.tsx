"use client";

import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";
import { Button } from "@/components/ui/Button";
import { base64ToDataUrl } from "@/lib/image";

type HistorySectionProps = {
  history: ProductCardResult[];
  onOpen: (card: ProductCardResult) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

function getHistoryThumbnail(card: ProductCardResult) {
  if (card.generatedImageUrl) {
    return card.generatedImageUrl;
  }

  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return base64ToDataUrl(card.generatedImageBase64, card.generatedImageMimeType);
  }

  return card.generatedImageDataUrl || card.imageDataUrl;
}

function getDesignPresetLabel(preset?: ImageDesignPreset) {
  if (preset === "luxury-catalog") {
    return "Luxury Catalog";
  }

  if (preset === "standard") {
    return "Standard";
  }

  if (preset === "premium-marketplace") {
    return "Premium Marketplace";
  }

  return null;
}

export function HistorySection({ history, onOpen, onRemove, onClear }: HistorySectionProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-ink/15 bg-[#fffaf0] p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-ink">Ваши карточки</h3>
          <p className="mt-1 text-sm text-muted">Сохранённые результаты — откройте и скачайте снова.</p>
        </div>
        <Button onClick={onClear} variant="ghost">
          Очистить
        </Button>
      </div>
      <div className="mt-5 grid gap-3">
        {history.map((card) => {
          const imageUrl = getHistoryThumbnail(card);
          const presetLabel = getDesignPresetLabel(card.designPreset);

          return (
            <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper p-4 md:flex-row md:items-center md:justify-between" key={card.id}>
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink/10 bg-white">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={imageUrl} />
                  ) : (
                    <span className="text-[10px] font-bold text-muted">Нет фото</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-ink">{card.headline || card.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {card.marketplace} · {new Date(card.generatedAt).toLocaleDateString("ru-RU")}
                    {card.price ? ` · ${card.price}` : ""}
                  </p>
                  {presetLabel ? (
                    <p className="mt-1 text-xs font-bold text-muted">{presetLabel}</p>
                  ) : null}
                  {card.ctaText ? (
                    <p className="mt-0.5 text-xs text-muted">CTA: {card.ctaText}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onOpen(card)} variant="secondary">
                  Открыть
                </Button>
                <Button onClick={() => onRemove(card.id)} variant="ghost">
                  Удалить
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
