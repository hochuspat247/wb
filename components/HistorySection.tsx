"use client";

import { useMemo, useState } from "react";
import { Film } from "lucide-react";
import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { getGeneratedCoverSrc } from "@/lib/image";
import { hasCardGeneratedVideo, getCardGeneratedVideos } from "@/lib/cardVideos";

type HistorySectionProps = {
  history: ProductCardResult[];
  onOpen: (card: ProductCardResult) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  marketplaces?: string[];
  styles?: string[];
};

function getHistoryThumbnail(card: ProductCardResult) {
  const cover = getGeneratedCoverSrc(card);

  if (cover) {
    return cover;
  }

  if (card.watermarkLocked) {
    return card.previewImageUrl ?? null;
  }

  return card.imageDataUrl;
}

function getDesignPresetLabel(preset?: ImageDesignPreset) {
  if (preset === "luxury-catalog") return "Luxury Catalog";
  if (preset === "standard") return "Standard";
  if (preset === "premium-marketplace") return "Premium Marketplace";
  return null;
}

export function HistorySection({
  history,
  onOpen,
  onRemove,
  onClear,
  marketplaces,
  styles
}: HistorySectionProps) {
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");

  const marketplaceOptions = marketplaces ?? [...new Set(history.map((c) => c.marketplace))];
  const styleOptions = styles ?? [...new Set(history.map((c) => c.style))];

  const filtered = useMemo(() => {
    return history.filter((card) => {
      const marketplaceOk = marketplaceFilter === "all" || card.marketplace === marketplaceFilter;
      const styleOk = styleFilter === "all" || card.style === styleFilter;
      return marketplaceOk && styleOk;
    });
  }, [history, marketplaceFilter, styleFilter]);

  if (history.length === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">История генераций</h3>
          <p className="mt-1 text-sm text-muted">{filtered.length} из {history.length} карточек</p>
        </div>
        <Button onClick={onClear} size="sm" variant="ghost">
          Очистить
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold text-muted">
          Маркетплейс
          <Select onChange={(e) => setMarketplaceFilter(e.target.value)} value={marketplaceFilter}>
            <option value="all">Все</option>
            {marketplaceOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-muted">
          Стиль
          <Select onChange={(e) => setStyleFilter(e.target.value)} value={styleFilter}>
            <option value="all">Все</option>
            {styleOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-5 grid gap-3">
        {filtered.map((card) => {
          const imageUrl = getHistoryThumbnail(card);
          const presetLabel = getDesignPresetLabel(card.designPreset);
          const videoCount = getCardGeneratedVideos(card).length;

          return (
            <div
              className="flex flex-col gap-3 rounded-card border border-clay bg-paper p-4 md:flex-row md:items-center md:justify-between"
              key={card.id}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-clay bg-card">
                  {imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className="h-full w-full object-cover" src={imageUrl} />
                      {card.watermarkLocked ? <WatermarkOverlay label="DEMO" className="opacity-100" /> : null}
                    </>
                  ) : (
                    <div className="grid h-full place-items-center text-[10px] font-medium text-muted">4:5</div>
                  )}
                  {hasCardGeneratedVideo(card) ? (
                    <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-paper">
                      <Film size={11} />
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-ink">{card.headline || card.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {card.marketplace} · {card.style} · {new Date(card.generatedAt).toLocaleDateString("ru-RU")}
                  </p>
                  {card.watermarkLocked ? (
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {card.downloadUnlocked
                        ? "Доступна для скачивания"
                        : "Скачивание недоступно — нужен пакет"}
                    </p>
                  ) : null}
                  {presetLabel ? <p className="mt-0.5 text-xs text-muted">{presetLabel}</p> : null}
                  {videoCount > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-accent">
                      {videoCount === 1 ? "Есть сохранённое видео" : `${videoCount} сохранённых видео`}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onOpen(card)} size="sm" variant="secondary">
                  Открыть
                </Button>
                <Button onClick={() => onRemove(card.id)} size="sm" variant="ghost">
                  Удалить
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
