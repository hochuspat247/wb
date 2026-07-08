"use client";

import { useEffect, useState } from "react";
import type { ProductCardResult } from "@/types/product-card";
import { CreateVideoFromCardBlock } from "@/components/video/CreateVideoFromCardBlock";
import { VideoConfigModal } from "@/components/video/VideoConfigModal";
import { VideoReadyScreen } from "@/components/video/VideoReadyScreen";
import { VideoWaitingScreen } from "@/components/video/VideoWaitingScreen";
import { fetchVideoCredits } from "@/lib/api/video";
import { hasGeneratedAiCover } from "@/lib/image";
import { trackMarketingEvent } from "@/components/analytics/trackMarketingEvent";

export type VideoFlowPhase = "idle" | "config" | "waiting" | "ready";

type VideoFromCardFlowProps = {
  card: ProductCardResult;
  compact?: boolean;
  darkConsole?: boolean;
  disabled?: boolean;
  initialOrderId?: string | null;
  onFlowReset?: () => void;
  onPhaseChange?: (phase: VideoFlowPhase) => void;
  onVideoReady?: () => void;
};

export function VideoFromCardFlow({
  card,
  compact,
  darkConsole,
  disabled,
  initialOrderId,
  onFlowReset,
  onPhaseChange,
  onVideoReady
}: VideoFromCardFlowProps) {
  const [phase, setPhase] = useState<VideoFlowPhase>(initialOrderId ? "waiting" : "idle");
  const [orderId, setOrderId] = useState<string | null>(initialOrderId || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoCredits, setVideoCredits] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVideoCredits().then(setVideoCredits).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      setPhase("waiting");
      trackMarketingEvent("video_payment_success", { orderId: initialOrderId });
    }
  }, [initialOrderId]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  if (!hasGeneratedAiCover(card)) {
    return null;
  }

  return (
    <>
      {phase === "idle" ? (
        <CreateVideoFromCardBlock
          darkConsole={darkConsole}
          disabled={disabled}
          onCreateClick={() => setPhase("config")}
        />
      ) : null}

      {phase === "waiting" && orderId ? (
        <VideoWaitingScreen
          compact={compact}
          onDone={(url) => {
            setVideoUrl(url);
            setPhase("ready");
            onVideoReady?.();
          }}
          onError={(message) => {
            setError(message);
            setPhase("idle");
          }}
          orderId={orderId}
        />
      ) : null}

      {phase === "ready" && videoUrl && orderId ? (
        <VideoReadyScreen
          compact={compact}
          onBackToCard={() => {
            setPhase("idle");
            setOrderId(null);
            setVideoUrl(null);
            onFlowReset?.();
          }}
          onCreateAnother={() => {
            setPhase("config");
            setVideoUrl(null);
          }}
          orderId={orderId}
          videoUrl={videoUrl}
        />
      ) : null}

      {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <VideoConfigModal
        card={card}
        onClose={() => setPhase("idle")}
        onOrderCreated={(nextOrderId) => {
          setOrderId(nextOrderId);
          setPhase("waiting");
        }}
        open={phase === "config"}
        videoCredits={videoCredits}
      />
    </>
  );
}
