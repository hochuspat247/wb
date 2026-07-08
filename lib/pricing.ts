import type { VideoDuration } from "@/types/video-generation";
import {
  VIDEO_STANDARD_PRICE_4_SEC,
  calculateVideoPriceRub,
  formatVideoPriceBreakdown,
  formatVideoPriceRub
} from "@/config/video-pricing";

export {
  VIDEO_STANDARD_PRICE_4_SEC,
  VIDEO_RETAIL_RUB_PER_SEC,
  calculateVideoPriceRub,
  formatVideoPriceBreakdown,
  formatVideoPriceRub,
  getVideoQualityLabel
} from "@/config/video-pricing";

/** @deprecated Используйте VIDEO_STANDARD_PRICE_4_SEC. */
export const VIDEO_STANDARD_PRICE_3_SEC = VIDEO_STANDARD_PRICE_4_SEC;

export const FREE_TRIAL_CARDS = 3;
export const CARD_GENERATION_PRICE_RUB = 55;

/** Минимальная цена видео (4 сек, standard). */
export const VIDEO_GENERATION_START_PRICE_RUB = VIDEO_STANDARD_PRICE_4_SEC;

/** @deprecated Используйте VIDEO_GENERATION_START_PRICE_RUB или calculateVideoPriceRub. */
export const VIDEO_GENERATION_PRICE_RUB = VIDEO_GENERATION_START_PRICE_RUB;

export type GenerationPackage = {
  id: string;
  count: number;
  label: string;
  description: string;
};

export const GENERATION_PACKAGES: GenerationPackage[] = [
  {
    id: "single",
    count: 1,
    label: "1 фото",
    description: "Разовая генерация обложки"
  },
  {
    id: "pack10",
    count: 10,
    label: "10 фото",
    description: "Для теста гипотез и новых SKU"
  },
  {
    id: "pack100",
    count: 100,
    label: "100 фото",
    description: "Для активного каталога"
  }
];

const BASE_PRICE_PER_UNIT = CARD_GENERATION_PRICE_RUB;
const PACKAGE_TOTAL_OVERRIDES: Record<number, number> = {
  5: CARD_GENERATION_PRICE_RUB * 5,
  10: 495,
  20: 990,
  100: 2860
};

export function calculatePackagePrice(count: number) {
  const fixedTotal = PACKAGE_TOTAL_OVERRIDES[count];
  if (fixedTotal) {
    const pricePerUnit = fixedTotal / count;

    return {
      count,
      pricePerUnit,
      total: fixedTotal,
      savingsPercent: Math.round((1 - pricePerUnit / BASE_PRICE_PER_UNIT) * 100)
    };
  }

  const discount = count >= 100 ? 0.52 : count >= 10 ? 0.68 : count >= 5 ? 0.78 : 1;
  const pricePerUnit = Math.max(1, Math.round(BASE_PRICE_PER_UNIT * discount));
  const total = pricePerUnit * count;

  return {
    count,
    pricePerUnit,
    total,
    savingsPercent: Math.round((1 - discount) * 100)
  };
}

export function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export const VIDEO_MARKETING_DURATIONS: VideoDuration[] = ["4", "6", "8"];

export function getVideoMarketingPrices(quality: "standard" | "pro" = "standard") {
  return VIDEO_MARKETING_DURATIONS.map((duration) => ({
    duration,
    priceRub: calculateVideoPriceRub(duration, quality)
  }));
}
