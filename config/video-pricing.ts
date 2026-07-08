import type { VideoDuration, VideoQuality } from "@/types/video-generation";

/** Базовая розничная цена: 4 сек standard (1080p fast, без звука) = 152 ₽. */
export const VIDEO_STANDARD_PRICE_4_SEC = 152;

/** GenAPI Veo 3.1 Fast img2video: 25 ₽/сек (1080p) и 75 ₽/сек (4K), без звука. */
export const VIDEO_GENAPI_RUB_PER_SEC: Record<VideoQuality, number> = {
  standard: 25,
  pro: 75
};

/** Розничный тариф для покупателя (руб/сек). */
export const VIDEO_RETAIL_RUB_PER_SEC: Record<VideoQuality, number> = {
  standard: VIDEO_STANDARD_PRICE_4_SEC / 4,
  pro: Math.round((VIDEO_GENAPI_RUB_PER_SEC.pro / VIDEO_GENAPI_RUB_PER_SEC.standard) * (VIDEO_STANDARD_PRICE_4_SEC / 4))
};

/** Допустимые значения duration для Veo 3.1 Fast через GenAPI. */
export const GENAPI_VIDEO_DURATIONS = ["4", "6", "8"] as const satisfies readonly VideoDuration[];

export const VIDEO_DURATION_OPTIONS: Array<{ value: VideoDuration; label: string }> = [
  { value: "4", label: "4 секунды (минимум)" },
  { value: "6", label: "6 секунд" },
  { value: "8", label: "8 секунд (максимум)" }
];

export const VIDEO_DURATION_VALUES = VIDEO_DURATION_OPTIONS.map((option) => option.value);

export function isGenApiVideoDuration(value: string): value is VideoDuration {
  return (GENAPI_VIDEO_DURATIONS as readonly string[]).includes(value);
}

export function getVideoDurationSeconds(duration: VideoDuration): number {
  return Number(duration);
}

export function getVideoRateRubPerSecond(quality: VideoQuality): number {
  return VIDEO_RETAIL_RUB_PER_SEC[quality];
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

export function getVideoDurationOptionLabel(duration: VideoDuration, quality: VideoQuality): string {
  const base = VIDEO_DURATION_OPTIONS.find((option) => option.value === duration);
  const price = formatVideoPriceRub(calculateVideoPriceRub(duration, quality));

  return `${base?.label ?? `${duration} сек`} — ${price}`;
}

export function getVideoQualityLabel(quality: VideoQuality): string {
  return quality === "pro" ? "Pro · 4K" : "Standard · 1080p";
}
