import { BRAND } from "@/lib/branding";
import { formatVideoPriceRub, VIDEO_STANDARD_PRICE_4_SEC } from "@/config/video-pricing";
import { MONTHLY_FREE_RESET_DAYS, MONTHLY_FREE_RESET_MS } from "@/lib/pricing";

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

/** Единая формулировка квоты — везде одинаково. */
export const STORY_GENERATION_EXPLAINER =
  "1 кредит = одна текстовая генерация (основа, персонаж, глава, анализ) или один портрет/медиа. Видео оплачивается отдельно.";

export const STORY_FREE_QUOTA_EXPLAINER = `Бесплатно после регистрации: ${STORY_FREE_TRIAL} текстовые генерации и ${STORY_FREE_PORTRAIT} портрет в месяц. Дальше — из купленных кредитов.`;

export const STORY_PACK_10_EXPLAINER =
  "10 кредитов хватит примерно на основу, несколько персонажей/портретов и 5–6 продолжений глав.";

export const STORY_PREMIUM_FEATURES = [
  "Длиннее главы: около 900–1400 слов вместо 700–1100",
  "Сильнее связность сюжета, мира и мотиваций героев",
  "Режим 18+ для взрослых тем и откровенных сцен"
] as const;

export const STORY_PREMIUM_SHORT =
  "Premium: длиннее главы, глубже связность сюжета и режим 18+";

export const STORY_PACKAGES: StoryPackage[] = [
  {
    id: "starter",
    count: 10,
    label: "Старт",
    description: "Начать историю и написать первые главы",
    badge: "Популярный",
    features: [
      "10 кредитов (текст или портрет/медиа)",
      STORY_PACK_10_EXPLAINER,
      "Карта связей и кабинет автора",
      `Видео — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ]
  },
  {
    id: "author",
    count: 50,
    label: "Автор",
    description: "Для активного написания и иллюстраций",
    features: [
      "50 кредитов (текст или портрет/медиа)",
      STORY_PREMIUM_SHORT,
      "Те же правила квоты, что в «Старте»",
      `Видео — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ]
  },
  {
    id: "studio",
    count: 100,
    label: "Студия",
    description: "Максимум творчества по лучшей цене",
    features: [
      "100 кредитов (текст или портрет/медиа)",
      STORY_PREMIUM_SHORT,
      "Лучшая цена за кредит (−41%)",
      `Видео — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
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
  return `Бесплатно: 1 демо-основа без регистрации, затем ${STORY_FREE_TRIAL} текстовые генерации и ${STORY_FREE_PORTRAIT} портрет после входа`;
}

export const STORY_PRICING_PLANS = [
  {
    id: "free",
    name: "Пробный",
    price: "0 ₽",
    period: "",
    features: [
      "1 демо-основа истории без регистрации",
      `${STORY_FREE_TRIAL} текстовые генерации после входа`,
      `${STORY_FREE_PORTRAIT} бесплатный портрет в месяц`,
      "Дальше — кредиты: текст или портрет/медиа"
    ],
    cta: "Попробовать бесплатно",
    highlighted: false
  },
  {
    id: "payg",
    name: "По запросу",
    price: formatStoryRub(STORY_GENERATION_PRICE_RUB),
    period: "за кредит",
    features: [
      "1 кредит = текст или портрет/медиа",
      "Основа, персонаж, глава, анализ или изображение",
      "Без подписки — платите за нужный результат",
      `Видео — отдельно, от ${formatVideoPriceRub(VIDEO_STANDARD_PRICE_4_SEC)}`
    ],
    cta: "Купить кредиты",
    highlighted: true
  }
] as const;
