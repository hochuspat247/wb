"use client";

import { useMemo, useState } from "react";
import { Film } from "lucide-react";
import type { ImageDesignPreset, ProductCardResult } from "@/types/product-card";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { WatermarkOverlay } from "@/components/ui/WatermarkOverlay";
import { groupCardsByProduct } from "@/lib/client/historyGroups";
import { getGeneratedCoverSrc } from "@/lib/image";
import { hasCardGeneratedVideo, getCardGeneratedVideos } from "@/lib/cardVideos";
import { SKU_KIT_SLIDE_COUNT } from "@/lib/pricing";

type HistorySectionProps = {
  history: ProductCardResult[];
  onOpen: (card: ProductCardResult) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onContinueKit?: (card: ProductCardResult) => void;
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
  if (preset === "luxury-catalog") return "Каталог · спокойный премиум";
  if (preset === "standard") return "Простой · меньше текста";
  if (preset === "premium-marketplace") return "Маркетплейс · яркие плашки";
  return null;
}

export function HistorySection({
  history,
  onOpen,
  onRemove,
  onClear,
  onContinueKit,
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

  const groups = useMemo(() => groupCardsByProduct(filtered), [filtered]);

  if (history.length === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">История по товарам</h3>
          <p className="mt-1 text-sm text-muted">
            {groups.length} {groups.length === 1 ? "товар" : "товаров"} · {filtered.length} слайдов
          </p>
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
        {groups.map((group) => {
          const card = group.coverCard;
          const imageUrl = getHistoryThumbnail(card);
          const presetLabel = getDesignPresetLabel(card.designPreset);
          const videoCount = group.cards.reduce((sum, item) => sum + getCardGeneratedVideos(item).length, 0);
          const showKitProgress = group.seriesCount > 1 || group.createdCount > 1;
          const target = Math.max(group.seriesCount, group.createdCount > 1 ? SKU_KIT_SLIDE_COUNT : 1);

          return (
            <div
              className="flex flex-col gap-3 rounded-card border border-clay bg-paper p-4 md:flex-row md:items-center md:justify-between"
              key={group.id}
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
                  {group.cards.some(hasCardGeneratedVideo) ? (
                    <span className="absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
                      <Film size={11} />
                    </span>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-ink">{group.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {card.marketplace} · {card.style} · обновлено{" "}
                    {new Date(group.updatedAt).toLocaleDateString("ru-RU")}
                  </p>
                  {showKitProgress ? (
                    <p className="mt-1 text-xs font-semibold text-accent-ink">
                      {group.isComplete
                        ? `Комплект: ${group.createdCount} слайдов`
                        : `Создано ${group.createdCount} из ${target} слайдов`}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">1 слайд</p>
                  )}
                  {card.watermarkLocked ? (
                    <p className="mt-1 text-xs font-semibold text-muted">С водяным знаком · демо</p>
                  ) : null}
                  {presetLabel ? <p className="mt-0.5 text-xs text-muted">{presetLabel}</p> : null}
                  {videoCount > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-accent-ink">
                      {videoCount === 1 ? "Есть сохранённое видео" : `${videoCount} сохранённых видео`}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => onOpen(card)} size="sm" variant="secondary">
                  {showKitProgress ? "Открыть комплект" : "Открыть"}
                </Button>
                {onContinueKit && showKitProgress && !group.isComplete ? (
                  <Button onClick={() => onContinueKit(card)} size="sm">
                    Продолжить комплект
                  </Button>
                ) : null}
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
