"use client";

import { Loader2, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { getGeneratedCoverSrc } from "@/lib/image";
import type { ProductCardResult } from "@/types/product-card";

type CardEditPanelProps = {
  card: ProductCardResult;
  editInstructions: string;
  onEditInstructionsChange: (value: string) => void;
  onClose: () => void;
  onRegenerate: () => void;
  isLoading?: boolean;
  remainingGenerations: number | null;
  darkConsole?: boolean;
};

export function CardEditPanel({
  card,
  editInstructions,
  onEditInstructionsChange,
  onClose,
  onRegenerate,
  isLoading = false,
  remainingGenerations,
  darkConsole = false
}: CardEditPanelProps) {
  const previewUrl = getGeneratedCoverSrc(card);
  const canRegenerate = editInstructions.trim().length > 0 && !isLoading && remainingGenerations !== 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center">
      <div
        className={`w-full max-w-lg rounded-[18px] border p-4 shadow-2xl sm:p-5 ${
          darkConsole ? "border-white/10 bg-ink-soft text-white" : "border-clay bg-card text-ink"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">{card.seriesPlanItem?.title || card.title}</h3>
            <p className={`mt-0.5 text-sm ${darkConsole ? "text-white/50" : "text-muted"}`}>
              Напишите правки — спишется 1 пробная карточка
            </p>
          </div>
          <button
            aria-label="Закрыть"
            className={`shrink-0 rounded-full p-1.5 ${darkConsole ? "text-white/60 hover:bg-white/10" : "text-muted hover:bg-paper"}`}
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {previewUrl ? (
          <div className={`mt-3 overflow-hidden rounded-[12px] border ${darkConsole ? "border-white/10" : "border-clay"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={card.title} className="aspect-[4/5] w-full max-h-40 object-cover" src={previewUrl} />
          </div>
        ) : null}

        <Textarea
          className="mt-3"
          onChange={(event) => onEditInstructionsChange(event.target.value)}
          placeholder="Например: короче заголовок, убрать «премиум», добавить размер M"
          rows={4}
          value={editInstructions}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!canRegenerate} onClick={onRegenerate} size="sm" type="button">
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
            {isLoading ? "Генерируем…" : "Перегенерировать"}
          </Button>
          <Button onClick={onClose} size="sm" type="button" variant="secondary">
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
