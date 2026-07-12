"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Wand2, X } from "lucide-react";
import { SeriesTypePicker } from "@/components/SeriesTypePicker";
import { Button } from "@/components/ui/Button";
import { generateCarouselCards, resolveProductImagePayload } from "@/lib/client/generateCarouselCards";
import { saveUserCardRemote } from "@/lib/api/user";
import { getGeneratedCoverSrc } from "@/lib/image";
import { reachGoal } from "@/lib/metrika";
import {
  buildSeriesStyleGuide,
  getDefaultAppendSeriesTypes,
  getExistingSeriesTypes,
  getMissingSeriesTypes,
  getSeriesAnchorId,
  getSeriesSiblingCards,
  getSeriesTypeLabel,
  sortSeriesTypes
} from "@/lib/series/plan";
import type { ProductCardResult } from "@/types/product-card";

type WildberriesGenerateCarouselPanelProps = {
  sourceCard: ProductCardResult;
  historyCards: ProductCardResult[];
  onClose?: () => void;
  onGenerated: (cards: ProductCardResult[]) => void;
  onQuotaChange?: (quota: { remaining: number; used: number; credits: number }) => void;
};

export function WildberriesGenerateCarouselPanel({
  sourceCard,
  historyCards,
  onClose,
  onGenerated,
  onQuotaChange
}: WildberriesGenerateCarouselPanelProps) {
  const siblings = useMemo(() => getSeriesSiblingCards(historyCards, sourceCard), [historyCards, sourceCard]);
  const seriesCards = useMemo(() => [sourceCard, ...siblings], [sourceCard, siblings]);
  const category = sourceCard.category || sourceCard.sourceInput?.category || "";
  const marketplace = sourceCard.marketplace || sourceCard.sourceInput?.marketplace || "Wildberries";
  const style = sourceCard.style || sourceCard.sourceInput?.style || "Премиальный";
  const existingTypes = useMemo(() => getExistingSeriesTypes(seriesCards), [seriesCards]);
  const missingTypes = useMemo(() => getMissingSeriesTypes(category, seriesCards), [category, seriesCards]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const hasProductPhoto = Boolean(resolveProductImagePayload(sourceCard));

  useEffect(() => {
    setSelectedTypes(getDefaultAppendSeriesTypes(missingTypes));
  }, [missingTypes.join("|"), sourceCard.id]);

  const plannedCount = selectedTypes.length;

  async function handleGenerate() {
    if (!selectedTypes.length) {
      setError("Выберите хотя бы один тип слайда для карусели.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const seriesId = getSeriesAnchorId(sourceCard);

      if (!sourceCard.seriesId) {
        await saveUserCardRemote({
          ...sourceCard,
          seriesId,
          seriesIndex: sourceCard.seriesIndex ?? 1,
          seriesStyleGuide: sourceCard.seriesStyleGuide || buildSeriesStyleGuide(style, marketplace)
        });
      }

      const result = await generateCarouselCards({
        sourceCard,
        historyCards,
        selectedTypes: sortSeriesTypes(selectedTypes, category),
        onProgress: setProgress
      });

      for (const card of result.cards) {
        await saveUserCardRemote(card);
      }

      if (result.quota) {
        onQuotaChange?.(result.quota);
      }

      reachGoal("wb_publish", { action: "generate_carousel", count: result.cards.length });
      setNotice(`Готово: сгенерировано ${result.cards.length} слайд(ов) для карусели.`);
      onGenerated(result.cards);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сгенерировать карточки.");
    } finally {
      setProgress("");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[20px] border border-[#CB11AB]/25 bg-[linear-gradient(160deg,rgba(203,17,171,0.08),rgba(255,255,255,0.02))] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#CB11AB]">Карусель WB</p>
          <h4 className="mt-1 text-lg font-black text-ink">Догенерировать слайды к товару</h4>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
            Передаём в нейросеть исходное фото, описание, характеристики и стиль товара «
            {sourceCard.headline || sourceCard.title}», чтобы новые слайды совпали с серией.
          </p>
        </div>
        {onClose ? (
          <button
            aria-label="Закрыть"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-clay text-muted transition hover:text-ink"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {!hasProductPhoto ? (
        <p className="mt-4 rounded-[14px] border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100">
          Исходное фото товара не найдено в карточке. Создайте карточку с загруженным фото, затем вернитесь сюда.
        </p>
      ) : null}

      {existingTypes.size ? (
        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Уже в карусели</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...existingTypes].map((type) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-bold text-mint"
                key={type}
              >
                <CheckCircle2 size={12} />
                {getSeriesTypeLabel(type, marketplace, style)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Какие слайды сгенерировать</p>
        {missingTypes.length ? (
          <>
            <p className="mt-1 text-xs font-semibold text-muted">
              Выбрано {plannedCount} · спишется {plannedCount} генераций. Типы можно комбинировать под карусель WB.
            </p>
            <div className="mt-3">
              <SeriesTypePicker
                availableTypes={missingTypes}
                category={category}
                marketplace={marketplace}
                onChange={setSelectedTypes}
                selectedTypes={selectedTypes.filter((type) => missingTypes.includes(type))}
                style={style}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm font-semibold text-muted">
            Все доступные типы слайдов для этой категории уже сгенерированы. Можно добавить фото из истории или загрузить
            вручную.
          </p>
        )}
      </div>

      {progress ? <p className="mt-4 text-sm font-semibold text-[#CB11AB]">{progress}</p> : null}
      {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm font-semibold text-mint">{notice}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={loading || !plannedCount || !hasProductPhoto} onClick={() => void handleGenerate()} size="sm">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          {loading ? "Генерируем…" : `Сгенерировать ${plannedCount || ""} слайд${plannedCount === 1 ? "" : plannedCount < 5 ? "а" : "ов"}`}
        </Button>
        {getGeneratedCoverSrc(sourceCard) ? (
          <div className="flex items-center gap-2 rounded-[14px] border border-clay bg-card/70 px-3 py-2">
            <div className="h-10 w-8 overflow-hidden rounded-md border border-clay bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="h-full w-full object-cover" src={getGeneratedCoverSrc(sourceCard)!} />
            </div>
            <p className="text-xs font-semibold text-muted">Исходная карточка и фото товара подтянутся автоматически</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
