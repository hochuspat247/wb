import { BRAND } from "@/lib/branding";

/** Тарифы ${BRAND.storyStudio}. */

export const STORY_FREE_TRIAL = 2;
export const STORY_GENERATION_PRICE_RUB = 39;

export type StoryPackage = {
  id: string;
  count: number;
  label: string;
  description: string;
  badge?: string;
  features: string[];
};

export const STORY_PACKAGES: StoryPackage[] = [
  {
    id: "starter",
    count: 10,
    label: "Старт",
    description: "10 генераций — история, персонажи, главы",
    badge: "Популярный",
    features: [
      "10 генераций любого типа",
      "История, персонажи и главы",
      "Портреты и дерево связей",
      "Редактор глав и видео-серии"
    ]
  },
  {
    id: "author",
    count: 50,
    label: "Автор",
    description: "Для активного написания и иллюстраций",
    features: [
      "50 генераций любого типа",
      "Портреты персонажей включены",
      "Премиум 18+ режим",
      "Приоритетная очередь"
    ]
  },
  {
    id: "studio",
    count: 100,
    label: "Студия",
    description: "Максимум творчества по лучшей цене",
    features: [
      "100 генераций любого типа",
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

export const STORY_PRICING_PLANS = [
  {
    id: "free",
    name: "Пробный",
    price: "0 ₽",
    period: "",
    features: [
      "1 история с ИИ-основой",
      "2 бесплатные генерации после регистрации",
      "Персонажи и дерево связей",
      "Редактор глав"
    ],
    cta: "Начать бесплатно",
    highlighted: false
  },
  {
    id: "payg",
    name: "По запросу",
    price: formatStoryRub(STORY_GENERATION_PRICE_RUB),
    period: "за генерацию",
    features: [
      "История, персонаж, глава или портрет",
      "Без подписки — платите только за результат",
      "Видео-серии из портретов персонажей",
      "Пакеты со скидкой до 41%"
    ],
    cta: "Купить генерации",
    highlighted: true
  }
] as const;
