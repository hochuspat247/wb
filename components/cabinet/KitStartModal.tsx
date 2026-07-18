"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { groupCardsByProduct } from "@/lib/client/historyGroups";
import { getGeneratedCoverSrc } from "@/lib/image";
import { KIT_SERIES_DESCRIPTION, SKU_KIT_SLIDE_COUNT } from "@/lib/pricing";
import type { ProductCardResult } from "@/types/product-card";

type KitStartMode = "pick" | "history" | "template";

type KitStartModalProps = {
  open: boolean;
  cards: ProductCardResult[];
  onClose: () => void;
  /** Full kit for an existing product (photo + description). */
  onSelectProduct: (card: ProductCardResult) => void;
  /** Blank kit form for a brand-new product. */
  onStartNew: () => void;
  /** New product, but reuse style/layout from a history card. */
  onStartNewWithTemplate: (card: ProductCardResult) => void;
};

function getThumb(card: ProductCardResult) {
  return getGeneratedCoverSrc(card) || card.previewImageUrl || card.imageDataUrl || null;
}

export function KitStartModal({
  open,
  cards,
  onClose,
  onSelectProduct,
  onStartNew,
  onStartNewWithTemplate
}: KitStartModalProps) {
  const [mode, setMode] = useState<KitStartMode>("pick");
  const groups = useMemo(() => groupCardsByProduct(cards).slice(0, 12), [cards]);

  if (!open) {
    return null;
  }

  function resetAndClose() {
    setMode("pick");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button aria-label="Закрыть" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetAndClose} type="button" />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-clay bg-card p-5 shadow-soft sm:p-7">
        <button
          aria-label="Закрыть"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-clay text-muted transition hover:text-ink"
          onClick={resetAndClose}
          type="button"
        >
          <X size={16} />
        </button>

        <div className="pr-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Комплект из {SKU_KIT_SLIDE_COUNT} слайдов</p>
          <h2 className="mt-2 text-xl font-black text-ink">С чего начнём серию?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {KIT_SERIES_DESCRIPTION}. Можно взять товар из истории или начать с нового — стиль при желании
            скопируем с готовой карточки.
          </p>
        </div>

        {mode === "pick" ? (
          <div className="mt-5 grid gap-3">
            <button
              className="flex items-start gap-3 rounded-[18px] border border-clay bg-paper p-4 text-left transition hover:border-accent/40"
              onClick={() => (groups.length ? setMode("history") : onStartNew())}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent-ink">
                <Layers size={18} />
              </span>
              <span>
                <span className="block text-sm font-black text-ink">Товар из истории</span>
                <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted">
                  Фото и описание уже есть — сразу выберете слайды комплекта.
                </span>
              </span>
            </button>

            <button
              className="flex items-start gap-3 rounded-[18px] border border-clay bg-paper p-4 text-left transition hover:border-accent/40"
              onClick={onStartNew}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent-ink">
                <Plus size={18} />
              </span>
              <span>
                <span className="block text-sm font-black text-ink">Новый товар с нуля</span>
                <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted">
                  Загрузите новое фото и описание, затем отметьте слайды серии.
                </span>
              </span>
            </button>

            <button
              className="flex items-start gap-3 rounded-[18px] border border-clay bg-paper p-4 text-left transition hover:border-accent/40"
              disabled={!groups.length}
              onClick={() => setMode("template")}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent-ink">
                <Sparkles size={18} />
              </span>
              <span>
                <span className="block text-sm font-black text-ink">Новый товар по шаблону из истории</span>
                <span className="mt-1 block text-xs font-semibold leading-relaxed text-muted">
                  Стиль и раскладка как у выбранной карточки, товар и фото — новые.
                </span>
              </span>
            </button>
          </div>
        ) : null}

        {mode === "history" || mode === "template" ? (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">
                {mode === "history" ? "Выберите товар" : "Какой шаблон взять?"}
              </p>
              <Button onClick={() => setMode("pick")} size="sm" type="button" variant="ghost">
                Назад
              </Button>
            </div>

            {!groups.length ? (
              <p className="rounded-[16px] border border-clay bg-paper px-4 py-3 text-sm text-muted">
                В истории пока нет карточек. Начните с нового товара.
              </p>
            ) : (
              <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1">
                {groups.map((group) => {
                  const thumb = getThumb(group.coverCard);
                  return (
                    <button
                      className="flex items-center gap-3 rounded-[16px] border border-clay bg-paper p-3 text-left transition hover:border-accent/40"
                      key={group.id}
                      onClick={() => {
                        if (mode === "history") {
                          onSelectProduct(group.coverCard);
                        } else {
                          onStartNewWithTemplate(group.coverCard);
                        }
                      }}
                      type="button"
                    >
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl border border-clay bg-card">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="h-full w-full object-cover" src={thumb} />
                        ) : (
                          <div className="grid h-full place-items-center text-[10px] text-muted">4:5</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{group.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {group.coverCard.marketplace} · {group.createdCount}{" "}
                          {group.createdCount === 1 ? "слайд" : "слайдов"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
