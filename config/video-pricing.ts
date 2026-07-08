import type { VideoDuration, VideoQuality } from "@/types/video-generation";

/** GenAPI Kling Video O3: image-to-video, без аудио, с изображением на входе (руб/сек). */
export const GENAPI_VIDEO_RATES_RUB_PER_SEC: Record<VideoQuality, number> = {
  standard: 63,
  pro: 84
};

export const VIDEO_DURATION_OPTIONS: Array<{ value: VideoDuration; label: string }> = [
  { value: "3", label: "3 секунды" },
  { value: "5", label: "5 секунд" },
  { value: "10", label: "10 секунд" },
  { value: "15", label: "15 секунд" }
];

export const VIDEO_DURATION_VALUES = VIDEO_DURATION_OPTIONS.map((option) => option.value);

export function getVideoDurationSeconds(duration: VideoDuration): number {
  return Number(duration);
}

export function getVideoRateRubPerSecond(quality: VideoQuality): number {
  return GENAPI_VIDEO_RATES_RUB_PER_SEC[quality];
}

export function calculateVideoPriceRub(duration: VideoDuration, quality: VideoQuality): number {
  return getVideoDurationSeconds(duration) * getVideoRateRubPerSecond(quality);
}

export function formatVideoPriceRub(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function formatVideoPriceBreakdown(duration: VideoDuration, quality: VideoQuality): string {
  const seconds = getVideoDurationSeconds(duration);
  const rate = getVideoRateRubPerSecond(quality);
  const total = calculateVideoPriceRub(duration, quality);

  return `${seconds} сек × ${rate} ₽/сек = ${formatVideoPriceRub(total)}`;
}
