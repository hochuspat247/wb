"use client";

import { Download, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type CabinetDemoWelcomeHintProps = {
  cardTitle?: string;
  onDismiss: () => void;
  onOpenCard: () => void;
};

export function CabinetDemoWelcomeHint({ cardTitle, onDismiss, onOpenCard }: CabinetDemoWelcomeHintProps) {
  return (
    <div className="mb-6 rounded-[20px] border border-accent/25 bg-[linear-gradient(135deg,rgba(124,255,107,0.14),rgba(124,255,107,0.04))] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={18} />
            <p className="text-xs font-black uppercase tracking-[0.16em]">Первая карточка в кабинете</p>
          </div>
          <h2 className="mt-2 text-lg font-black text-ink sm:text-xl">Демо-карточка уже в истории</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
            {cardTitle
              ? `«${cardTitle}» сохранена после регистрации. Откройте её в истории и скачайте без водяного знака.`
              : "После регистрации демо-карточка сохраняется в истории. Откройте её и скачайте без водяного знака."}
          </p>
        </div>
        <button
          aria-label="Закрыть подсказку"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-card hover:text-ink"
          onClick={onDismiss}
          type="button"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onOpenCard} size="sm" type="button">
          <Download size={16} />
          Открыть карточку
        </Button>
        <Button onClick={onDismiss} size="sm" type="button" variant="ghost">
          Понятно
        </Button>
      </div>
    </div>
  );
}
