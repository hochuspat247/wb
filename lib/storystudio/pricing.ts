import { BRAND } from "@/lib/branding";
import { MONTHLY_FREE_RESET_DAYS, MONTHLY_FREE_RESET_MS } from "@/lib/pricing";
import { formatVideoPriceRub, VIDEO_STANDARD_PRICE_4_SEC } from "@/config/video-pricing";

/** Тарифы ${BRAND.storyStudio}. */

export const STORY_MONTHLY_RESET_DAYS = MONTHLY_FREE_RESET_DAYS;
export const STORY_MONTHLY_RESET_MS = MONTHLY_FREE_RESET_MS;
export const STORY_FREE_TRIAL = 2;
export const STORY_FREE_PORTRAIT = 1;
export const STORY_DEMO_MONTHLY_LIMIT = 1;
export const STORY_GENERATION_PRICE_RUB = 39;

export type StoryPackage = {
  id: string;
  count: number;
  label: string;
  description: string;
  badge?: string;
  features: string[];
};

export const STORY_GENERATION_EXPLAINER =
  "1 генерация = одна AI-операция: основа истории, персонаж, глава или анализ. Портреты и медиа считаются отдельно. Видео оплачивается отдельно.";

export const STORY_PACK_10_EXPLAINER =
  "10 генераций хватит примерно на основу истории, 3 персонажей и 5–6 продолжений глав.";

export const STORY_PACKAGES: StoryPackage[] = [
  {
    id: "starter",
    count: 10,
    label: "Старт",
    description: "Начать историю и написать первые главы",
    badge: "Популярный",
    features: [
      "10 текстовых генераций",
      STORY_PACK_10_EXPLAINER,
      "Портреты и карта связей в кабинете",
      `Видео-сцены — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ]
  },
  {
    id: "author",
    count: 50,
    label: "Автор",
    description: "Для активного написания и иллюстраций",
    features: [
      "50 текстовых генераций",
      "Портреты и медиа из той же квоты",
      "Premium: глубже сюжет + режим 18+",
      `Доступ к видео; ролики — от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ]
  },
  {
    id: "studio",
    count: 100,
    label: "Студия",
    description: "Максимум творчества по лучшей цене",
    features: [
      "100 текстовых генераций",
      "Лучшая цена за генерацию",
      `Все функции ${BRAND.storyStudio}`,
      "Максимальная скидка −41%"
    ]
  }
];

const BASE = STORY_GENERATION_PRICE_RUB;
const OVERRIDES: Record<number, number> = {
  1: 39,
  10: 349,
  50: 1490,
  100: 2290
};

export function calculateStoryPackagePrice(count: number) {
  const fixedTotal = OVERRIDES[count];
  if (fixedTotal) {
    const pricePerUnit = fixedTotal / count;
    return {
      count,
      pricePerUnit,
      total: fixedTotal,
      savingsPercent: Math.round((1 - pricePerUnit / BASE) * 100)
    };
  }

  const discount = count >= 100 ? 0.41 : count >= 50 ? 0.24 : count >= 10 ? 0.1 : 1;
  const pricePerUnit = Math.max(1, Math.round(BASE * discount));
  const total = pricePerUnit * count;

  return {
    count,
    pricePerUnit,
    total,
    savingsPercent: Math.round((1 - discount) * 100)
  };
}

export function formatStoryRub(value: number) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

export function describeStoryFreeQuotaMarketing() {
  return `Бесплатно один раз: демо-основа истории и ${STORY_FREE_TRIAL} пробные генерации после регистрации`;
}

export const STORY_PRICING_PLANS = [
  {
    id: "free",
    name: "Пробный",
    price: "0 ₽",
    period: "",
    features: [
      "1 демо-основа истории без регистрации",
      `${STORY_FREE_TRIAL} пробные генерации после регистрации`,
      "Синопсис, персонажи и план сюжета",
      "Полноценные главы и портреты — после покупки"
    ],
    cta: "Попробовать бесплатно",
    highlighted: false
  },
  {
    id: "payg",
    name: "По запросу",
    price: formatStoryRub(STORY_GENERATION_PRICE_RUB),
    period: "за генерацию",
    features: [
      "Основа истории, персонаж, глава или анализ",
      "Без подписки — платите за нужный результат",
      "Режим чтения, PDF и публичная ссылка",
      `Видео — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ],
    cta: "Купить генерации",
    highlighted: true
  }
] as const;
