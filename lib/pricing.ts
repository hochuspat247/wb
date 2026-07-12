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

export const FREE_DEMO_CARDS = 1;
export const FREE_TRIAL_CARDS = 3;
export const MONTHLY_FREE_RESET_DAYS = 30;
export const MONTHLY_FREE_RESET_MS = MONTHLY_FREE_RESET_DAYS * 24 * 60 * 60 * 1000;
export const FREE_TOTAL_MARKETING_CARDS = FREE_DEMO_CARDS + FREE_TRIAL_CARDS;

export function describeMonthlyFreeQuotaShort() {
  return `${FREE_TRIAL_CARDS} карточки каждый месяц`;
}

export function describeFreeQuotaMarketing() {
  return `1 демо без входа + ${FREE_TRIAL_CARDS} карточки каждый месяц`;
}

export function describeMonthlyFreeReset() {
  return `Бесплатные ${FREE_TRIAL_CARDS} карточки обновляются каждые ${MONTHLY_FREE_RESET_DAYS} дней`;
}

export function formatMonthlyFreeResetDate(value: Date | string | number | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function formatMonthlyFreeResetHint(resetsAt?: string | null) {
  const label = formatMonthlyFreeResetDate(resetsAt);
  return label ? `Следующее обновление бесплатных карточек — ${label}.` : describeMonthlyFreeReset();
}

export function formatCabinetQuotaBanner(input: {
  remaining: number;
  unlimited?: boolean;
  monthlyFreeRemaining?: number;
  monthlyFreeAllowance?: number;
  monthlyFreeResetsAt?: string | null;
}) {
  if (input.unlimited || input.remaining >= 999_000) {
    return "Безлимитные генерации для вашего аккаунта.";
  }

  const allowance = input.monthlyFreeAllowance ?? FREE_TRIAL_CARDS;
  const monthlyRemaining = input.monthlyFreeRemaining ?? Math.min(input.remaining, allowance);
  const resetHint = formatMonthlyFreeResetHint(input.monthlyFreeResetsAt);

  if (input.remaining === 0) {
    return `Бесплатные ${allowance} карточки в этом месяце использованы. ${resetHint} Или купите пакет — генерации не сгорают.`;
  }

  return `${describeFreeQuotaMarketing()}. Сейчас доступно: ${input.remaining} (${monthlyRemaining} из ${allowance} бесплатных в этом месяце). ${resetHint}`;
}

export const CARD_GENERATION_PRICE_RUB = 55;
export const WB_INTEGRATION_MIN_PACKAGE = 5;

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
