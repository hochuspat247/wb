import {
  GENAPI_VIDEO_DURATIONS,
  calculateVideoPriceRub,
  formatVideoPriceRub,
  getVideoDurationSeconds
} from "@/config/video-pricing";

/** Минимальный заказ на upsell: standard 1080p, без звука (как в чекауте). */
const VIDEO_RESULT_UPSELL_DURATION = GENAPI_VIDEO_DURATIONS[0];

function formatVideoDurationLabel(seconds: number): string {
  const mod10 = seconds % 10;
  const mod100 = seconds % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${seconds} секунда`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${seconds} секунды`;
  }

  return `${seconds} секунд`;
}

export const VIDEO_RESULT_UPSELL_PRICE_RUB = calculateVideoPriceRub(VIDEO_RESULT_UPSELL_DURATION, "standard");

export const VIDEO_RESULT_UPSELL_PRICE_LABEL = formatVideoPriceRub(VIDEO_RESULT_UPSELL_PRICE_RUB);

export const VIDEO_RESULT_UPSELL_DURATION_LABEL = formatVideoDurationLabel(
  getVideoDurationSeconds(VIDEO_RESULT_UPSELL_DURATION)
);
