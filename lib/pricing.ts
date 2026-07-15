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
/** One free full-card download after registration (does not renew monthly). */
export const FREE_TRIAL_CARDS = 1;
/** @deprecated Free quota no longer resets monthly — kept for legacy imports. */
export const MONTHLY_FREE_RESET_DAYS = 30;
/** @deprecated Free quota no longer resets monthly. */
export const MONTHLY_FREE_RESET_MS = MONTHLY_FREE_RESET_DAYS * 24 * 60 * 60 * 1000;
export const FREE_TOTAL_MARKETING_CARDS = FREE_DEMO_CARDS + FREE_TRIAL_CARDS;

export const SKU_KIT_SLIDE_COUNT = 5;
export const PLAN_FREE_NAME = "Бесплатно";
export const PLAN_SKU_KIT_NAME = "Комплект для одного товара";
export const PLAN_CATALOG_NAME = "Каталог";

export const GENERATION_TIME_COPY = "Обычно 1–2 минуты в зависимости от загрузки сервиса";

export function describeMonthlyFreeQuotaShort() {
  return `${FREE_TRIAL_CARDS} скачивание без водяного знака после регистрации`;
}

export function describeFreeQuotaMarketing() {
  return `1 демо с защитной меткой без регистрации + ${FREE_TRIAL_CARDS} скачивание без водяного знака после регистрации`;
}

export function describeMonthlyFreeReset() {
  return "Бесплатный лимит не обновляется каждый месяц";
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

export function formatMonthlyFreeResetHint(_resetsAt?: string | null) {
  return `${describeMonthlyFreeReset()}.`;
}

export function formatCabinetQuotaBanner(input: {
  remaining: number;
  unlimited?: boolean;
  monthlyFreeRemaining?: number;
  monthlyFreeAllowance?: number;
  monthlyFreeResetsAt?: string | null;
}) {
  if (input.unlimited || input.remaining >= 999_000) {
    return "Безлимитные комплекты для вашего аккаунта.";
  }

  const allowance = input.monthlyFreeAllowance ?? FREE_TRIAL_CARDS;
  const monthlyRemaining = input.monthlyFreeRemaining ?? Math.min(input.remaining, allowance);
  const oneTimeHint = formatMonthlyFreeResetHint();

  if (input.remaining === 0) {
    return `Бесплатное скачивание использовано. ${oneTimeHint} Купите комплект для одного товара — слайды не сгорают.`;
  }

  return `${describeFreeQuotaMarketing()}. Сейчас доступно: ${input.remaining} (бесплатных осталось ${monthlyRemaining} из ${allowance}). ${oneTimeHint}`;
}

/** Поштучная цена одного слайда. Комплект из 5 дешевле за счёт упаковки SKU. */
export const CARD_GENERATION_PRICE_RUB = 98;
export const WB_INTEGRATION_MIN_PACKAGE = SKU_KIT_SLIDE_COUNT;
export const SKU_KIT_PRICE_RUB = 275;
export const CATALOG_PACK_PRICE_RUB = 990;

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
    label: "1 слайд",
    description: "Разовый слайд для доработки комплекта"
  },
  {
    id: "pack10",
    count: 10,
    label: "2 комплекта",
    description: "10 слайдов — до двух SKU по 5"
  },
  {
    id: "pack100",
    count: 100,
    label: "100 слайдов",
    description: "Для активного каталога"
  }
];

const BASE_PRICE_PER_UNIT = CARD_GENERATION_PRICE_RUB;
/**
 * Комплект для одного SKU: 5 связанных слайдов за 275 ₽ (~44% дешевле поштучной цены).
 * Каталог: 20 слайдов за 990 ₽.
 */
const PACKAGE_TOTAL_OVERRIDES: Record<number, number> = {
  5: SKU_KIT_PRICE_RUB,
  10: 495,
  20: CATALOG_PACK_PRICE_RUB,
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
