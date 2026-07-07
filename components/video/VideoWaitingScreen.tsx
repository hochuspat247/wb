"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchVideoOrderStatus } from "@/lib/api/video";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";
import type { VideoGenerationStatus } from "@/types/video-generation";

const WAITING_STEPS = [
  "Готовим карточку",
  "Передаём изображение в Kling Video O3",
  "Добавляем плавное движение",
  "Проверяем, чтобы текст не поплыл",
  "Готовим видео",
  "Почти готово"
];

const POLL_INTERVAL_MS = 7000;
const TIMEOUT_MS = 10 * 60 * 1000;

type VideoWaitingScreenProps = {
  orderId: string;
  onDone: (videoUrl: string) => void;
  onError: (message: string) => void;
};

function isProcessingStatus(status: VideoGenerationStatus) {
  return status === "payment_pending" || status === "paid" || status === "queued" || status === "processing";
}

export function VideoWaitingScreen({ orderId, onDone, onError }: VideoWaitingScreenProps) {
  const [status, setStatus] = useState<VideoGenerationStatus>("queued");
  const [progress, setProgress] = useState(8);
  const [stepIndex, setStepIndex] = useState(0);
  const startedAt = useMemo(() => Date.now(), []);
  const generationTrackedRef = useRef(false);

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 2, 95));
      setStepIndex((current) => Math.min(current + 1, WAITING_STEPS.length - 1));
    }, 4500);

    return () => window.clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (Date.now() - startedAt > TIMEOUT_MS) {
        onError("Генерация видео заняла слишком много времени. Попробуйте проверить позже в истории.");
        return;
      }

      try {
        const result = await fetchVideoOrderStatus(orderId);
        if (cancelled) return;

        setStatus(result.status);

        if (
          !generationTrackedRef.current &&
          (result.status === "paid" || result.status === "queued" || result.status === "processing")
        ) {
          generationTrackedRef.current = true;
          trackMarketingEvent("video_generation_started", { orderId });
        }

        if (result.status === "done" && result.originalVideoUrl) {
          setProgress(100);
          trackMarketingEvent("video_generation_completed", { orderId });
          onDone(result.originalVideoUrl);
          return;
        }

        if (result.status === "error") {
          trackMarketingEvent("video_generation_failed", { orderId, error: result.error || "unknown" });
          onError(result.error || "Не удалось создать видео.");
          return;
        }

        if (isProcessingStatus(result.status)) {
          window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (caught) {
        if (!cancelled) {
          onError(caught instanceof Error ? caught.message : "Не удалось проверить статус видео.");
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
    };
  }, [orderId, onDone, onError, startedAt]);

  return (
    <div className="rounded-[24px] border border-clay bg-card p-6 md:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">GenAPI · Kling Video O3</p>
      <h3 className="mt-3 text-2xl font-black text-ink">Оживляем карточку</h3>
      <p className="mt-2 text-sm font-medium text-muted">Видео уже создаётся. Обычно это занимает 2–3 минуты.</p>

      <div className="mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Loader2 className="animate-spin" size={16} />
          {WAITING_STEPS[stepIndex]}
        </p>
        <p className="mt-1 text-xs font-medium text-muted">Статус: {status}</p>
      </div>
    </div>
  );
}
