"use client";

import { useEffect, useState } from "react";
import { Download, Film, Loader2 } from "lucide-react";
import { fetchVideoHistory } from "@/lib/api/video";
import { formatVideoPriceRub } from "@/config/video-pricing";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ProductCardResult } from "@/types/product-card";
import type { VideoGenerationRecord } from "@/types/video-generation";
import { getGeneratedCoverSrc } from "@/lib/image";

const statusLabels: Record<string, string> = {
  payment_pending: "Ожидает оплаты",
  paid: "Оплачено",
  queued: "В очереди",
  processing: "Генерируется",
  done: "Готово",
  error: "Ошибка",
  cancelled: "Отменено"
};

type VideoHistorySectionProps = {
  cards?: ProductCardResult[];
  onOpen?: (order: VideoGenerationRecord) => void;
};

function getOrderPreview(order: VideoGenerationRecord, cards: ProductCardResult[]) {
  const card = cards.find((item) => item.id === order.sourceGenerationId);
  return card ? getGeneratedCoverSrc(card) || card.imageDataUrl : order.sourceImageUrl;
}

export function VideoHistorySection({ cards = [], onOpen }: VideoHistorySectionProps) {
  const [orders, setOrders] = useState<VideoGenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVideoHistory()
      .then(setOrders)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card padding="md">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Loader2 className="animate-spin" size={16} />
          Загружаем видео…
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md">
        <p className="text-sm font-semibold text-red-600">{error}</p>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card padding="md">
        <h3 className="text-lg font-bold text-ink">Видео</h3>
        <p className="mt-2 text-sm text-muted">Здесь появятся оплаченные видео из ваших карточек.</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">Видео</h3>
          <p className="mt-1 text-sm text-muted">{orders.length} заказ(ов)</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {orders.map((order) => (
          <div className="grid gap-4 rounded-[18px] border border-clay bg-paper/40 p-4 md:grid-cols-[120px_1fr_auto]" key={order.id}>
            <div className="overflow-hidden rounded-[12px] border border-clay bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Исходная карточка" className="aspect-[4/5] w-full object-cover" src={getOrderPreview(order, cards)} />
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-black text-ink">
                <Film size={15} />
                {order.duration} сек · {order.aspectRatio} · {order.quality}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {statusLabels[order.status] || order.status} · {order.amountRub ? formatVideoPriceRub(order.amountRub) : "video-credit"}
              </p>
              <p className="mt-1 text-xs text-muted">{new Date(order.createdAt).toLocaleString("ru-RU")}</p>
              {order.error ? <p className="mt-2 text-xs font-semibold text-red-600">{order.error}</p> : null}
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => onOpen?.(order)} size="sm" type="button" variant="secondary">
                Открыть
              </Button>
              {order.status === "done" && order.originalVideoUrl ? (
                <Button
                  onClick={() => {
                    trackMarketingEvent("video_download", { orderId: order.id });
                    window.open(`/api/video/orders/${order.id}/download`, "_blank");
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Download size={14} />
                  Скачать
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
