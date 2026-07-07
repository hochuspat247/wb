import type { VideoDuration, VideoQuality } from "@/types/video-generation";

const VIDEO_PRICES: Record<VideoDuration, Record<VideoQuality, number>> = {
  "5": { standard: 99, pro: 149 },
  "10": { standard: 179, pro: 249 }
};

export function calculateVideoPriceRub(duration: VideoDuration, quality: VideoQuality): number {
  return VIDEO_PRICES[duration][quality];
}

export function formatVideoPriceRub(amount: number): string {
  return `${amount} ₽`;
}
