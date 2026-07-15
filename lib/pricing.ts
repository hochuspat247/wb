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
/** Free generations after registration — always with watermark, no monthly reset. */
export const FREE_TRIAL_CARDS = 2;
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

/** Маркетинговое описание серии в платном комплекте. */
export const KIT_SERIES_DESCRIPTION = "Обложка + 4 инфографических слайда для одного товара";

export const KIT_UNLOCK_CTA = "Скачать без водяного знака — купить комплект";

export function describeMonthlyFreeQuotaShort() {
  return `${FREE_TRIAL_CARDS} пробные карточки один раз после регистрации`;
}

export function describeFreeQuotaMarketing() {
  return `${FREE_TRIAL_CARDS} пробные карточки один раз после регистрации (с водяным знаком)`;
}

export function describeMonthlyFreeReset() {
  return `${FREE_TRIAL_CARDS} пробные карточки не обновляются каждый месяц`;
}

export function describeSeriesRequiresPurchase() {
  return `${KIT_SERIES_DESCRIPTION} — доступно в комплекте «${PLAN_SKU_KIT_NAME}»`;
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
  const oneTimeHint = formatMonthlyFreeResetHint();

  if (input.remaining === 0) {
    return `Пробные карточки использованы. ${oneTimeHint} Купите «${PLAN_SKU_KIT_NAME}» — ${KIT_SERIES_DESCRIPTION.toLowerCase()} без метки.`;
  }

  return `Осталось ${input.remaining} из ${allowance} пробных карточек с водяным знаком. ${KIT_SERIES_DESCRIPTION} — в платном комплекте. ${oneTimeHint}`;
}

/** Базовая поштучная цена одного слайда (калькулятор). */
export const CARD_GENERATION_PRICE_RUB = 45;
/** База для фиксированных тарифных пакетов до скидки пакета. */
export const TARIFF_BASE_PRICE_PER_UNIT = 40;
/** Скидка на фиксированные тарифные пакеты (5 / 10 / 20 слайдов). */
export const TARIFF_PACKAGE_DISCOUNT_PERCENT = 10;
export const WB_INTEGRATION_MIN_PACKAGE = SKU_KIT_SLIDE_COUNT;

const TARIFF_PACKAGE_COUNTS = new Set([SKU_KIT_SLIDE_COUNT, 10, 20]);

export function calculateTariffPackageTotal(count: number) {
  return Math.round(count * TARIFF_BASE_PRICE_PER_UNIT * (1 - TARIFF_PACKAGE_DISCOUNT_PERCENT / 100));
}

export const SKU_KIT_PRICE_RUB = calculateTariffPackageTotal(SKU_KIT_SLIDE_COUNT);
export const CATALOG_PACK_PRICE_RUB = calculateTariffPackageTotal(20);

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

function getVolumeDiscountPercent(count: number) {
  if (count >= 60) return 30;
  if (count >= 50) return 25;
  if (count >= 40) return 20;
  if (count >= 30) return 15;
  if (count >= 20) return 10;
  if (count >= 10) return 5;
  return 0;
}

function buildPackagePrice(count: number, total: number, savingsPercent: number) {
  return {
    count,
    pricePerUnit: Math.round(total / count),
    total,
    savingsPercent
  };
}

export function calculatePackagePrice(count: number) {
  if (TARIFF_PACKAGE_COUNTS.has(count)) {
    const total = calculateTariffPackageTotal(count);
    const pricePerUnit = total / count;

    return buildPackagePrice(
      count,
      total,
      Math.round((1 - pricePerUnit / CARD_GENERATION_PRICE_RUB) * 100)
    );
  }

  const discountPercent = getVolumeDiscountPercent(count);
  const total = Math.round(count * CARD_GENERATION_PRICE_RUB * (1 - discountPercent / 100));

  return buildPackagePrice(count, total, discountPercent);
}

export function formatRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

/** Кнопки покупки — с ценой и результатом, сильнее абстрактного «Подключить». */
export function kitBuyCta() {
  return `Купить комплект за ${formatRub(SKU_KIT_PRICE_RUB)}`;
}

export function catalogBuyCta() {
  return `Купить 20 слайдов за ${formatRub(CATALOG_PACK_PRICE_RUB)}`;
}

export function slidesBuyCta(count: number, totalRub: number) {
  if (count === SKU_KIT_SLIDE_COUNT) {
    return kitBuyCta();
  }

  if (count === 20) {
    return catalogBuyCta();
  }

  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  const word = n > 10 && n < 20 ? "слайдов" : n1 === 1 ? "слайд" : n1 >= 2 && n1 <= 4 ? "слайда" : "слайдов";

  return `Купить ${count} ${word} за ${formatRub(totalRub)}`;
}

export const VIDEO_MARKETING_DURATIONS: VideoDuration[] = ["4", "6", "8"];

export function getVideoMarketingPrices(quality: "standard" | "pro" = "standard") {
  return VIDEO_MARKETING_DURATIONS.map((duration) => ({
    duration,
    priceRub: calculateVideoPriceRub(duration, quality)
  }));
}
