"use client";

import { useState } from "react";
import { CheckCircle2, Settings, Store, UploadCloud } from "lucide-react";
import { WildberriesCardsCatalog } from "@/components/wildberries/WildberriesCardsCatalog";
import { WildberriesPublishPanel } from "@/components/wildberries/WildberriesPublishPanel";
import { WildberriesSubscriptionOverlay } from "@/components/wildberries/WildberriesSubscriptionOverlay";
import { WildberriesBetaNotice } from "@/components/wildberries/WildberriesBetaNotice";
import { WildberriesConnectGuide } from "@/components/wildberries/WildberriesConnectGuide";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getGeneratedCoverSrc } from "@/lib/image";
import { getSeriesSiblingCards } from "@/lib/series/plan";
import type { ProductCardResult } from "@/types/product-card";

type WildberriesCabinetSectionProps = {
  cards: ProductCardResult[];
  wbConnected: boolean;
  wbUnlocked: boolean;
  onNeedConnect: () => void;
  onOpenCard: (card: ProductCardResult) => void;
  onGenerateMore: () => void;
  onCardsRefresh?: () => void;
  onQuotaChange?: (quota: { remaining: number; used: number; credits: number }) => void;
};

function getThumbnail(card: ProductCardResult) {
  return getGeneratedCoverSrc(card) || card.imageDataUrl || null;
}

export function WildberriesCabinetSection({
  cards,
  wbConnected,
  wbUnlocked,
  onNeedConnect,
  onOpenCard,
  onGenerateMore,
  onCardsRefresh,
  onQuotaChange
}: WildberriesCabinetSectionProps) {
  const [publishCardId, setPublishCardId] = useState<string | null>(cards[0]?.id ?? null);
  const publishCard = cards.find((item) => item.id === publishCardId) ?? cards[0] ?? null;
  const relatedCards = publishCard ? getSeriesSiblingCards(cards, publishCard) : [];

  return (
    <WildberriesSubscriptionOverlay className="mx-auto max-w-6xl space-y-6" unlocked={wbUnlocked}>
      <Card padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#CB11AB]">
              <Store size={18} />
              <p className="text-xs font-black uppercase tracking-[0.16em]">Интеграция WB</p>
            </div>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">Wildberries</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
              Публикуйте карточки из истории, редактируйте каталог WB, загружайте фото и тексты. Дубли и серии
              подтягиваются автоматически.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                wbConnected ? "bg-mint/15 text-mint" : "bg-paper text-muted"
              }`}
            >
              {wbConnected ? <CheckCircle2 size={14} /> : null}
              {wbConnected ? "API подключён" : "API не подключён"}
            </span>
            <Button onClick={onNeedConnect} size="sm" variant="secondary">
              <Settings size={15} />
              Настройки WB
            </Button>
          </div>
        </div>
        <WildberriesBetaNotice className="mt-4" />
        {!wbConnected ? <WildberriesConnectGuide className="mt-4" onOpenSettings={onNeedConnect} /> : null}
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[#CB11AB]">
              <UploadCloud size={17} />
              <p className="text-xs font-black uppercase tracking-[0.16em]">Публикация</p>
            </div>
            <h2 className="mt-1 text-xl font-black text-ink">Опубликовать из истории</h2>
            <p className="mt-1 text-sm font-semibold text-muted">
              Выберите карточку и отправьте на WB с каруселью слайдов.
            </p>
          </div>
        </div>

        {cards.length === 0 ? (
          <Card className="py-10 text-center" padding="lg">
            <p className="text-lg font-bold text-ink">Пока нет карточек для публикации</p>
            <p className="mt-2 text-sm text-muted">Создайте карточку во вкладке «Создать», затем вернитесь сюда.</p>
            <Button className="mt-4" onClick={onGenerateMore} size="sm">
              Создать карточку
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.slice(0, 8).map((card) => {
                const thumb = getThumbnail(card);
                const active = publishCard?.id === card.id;

                return (
                  <button
                    className={`overflow-hidden rounded-[18px] border bg-card text-left transition ${
                      active
                        ? "border-[#CB11AB] shadow-[0_12px_32px_rgba(203,17,171,0.12)]"
                        : "border-clay hover:border-[#CB11AB]/35"
                    }`}
                    key={card.id}
                    onClick={() => setPublishCardId(card.id)}
                    type="button"
                  >
                    <div className="relative aspect-[4/5] bg-paper">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="h-full w-full object-cover" src={thumb} />
                      ) : (
                        <div className="grid h-full place-items-center text-xs font-semibold text-muted">Нет фото</div>
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-2 text-sm font-black text-ink">{card.headline || card.title}</p>
                      <p className="text-xs text-muted">{card.marketplace}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {publishCard ? (
              <WildberriesPublishPanel
                card={publishCard}
                historyCards={cards}
                onCardsGenerated={() => onCardsRefresh?.()}
                onNeedConnect={onNeedConnect}
                onQuotaChange={onQuotaChange}
                relatedCards={relatedCards}
                wbConnected={wbConnected}
                wbUnlocked={wbUnlocked}
              />
            ) : null}

            {cards.length > 8 ? (
              <p className="text-center text-xs font-semibold text-muted">
                Ещё {cards.length - 8} карточек — откройте нужную из{" "}
                <button className="font-black text-[#CB11AB] underline" onClick={() => onOpenCard(cards[8]!)} type="button">
                  истории
                </button>
                .
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section>
        <WildberriesCardsCatalog onNeedConnect={onNeedConnect} wbConnected={wbConnected} wbUnlocked={wbUnlocked} />
      </section>
    </WildberriesSubscriptionOverlay>
  );
}
