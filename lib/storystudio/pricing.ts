/** StoryStudio — чуть дешевле Novely и MarketCard. */

export const STORY_FREE_TRIAL = 2;
export const STORY_GENERATION_PRICE_RUB = 39;

export type StoryPackage = {
  id: string;
  count: number;
  label: string;
  description: string;
  badge?: string;
};

export const STORY_PACKAGES: StoryPackage[] = [
  {
    id: "starter",
    count: 10,
    label: "Старт",
    description: "10 генераций — история, персонажи, главы",
    badge: "Популярный"
  },
  {
    id: "author",
    count: 50,
    label: "Автор",
    description: "Для активного написания и иллюстраций"
  },
  {
    id: "studio",
    count: 100,
    label: "Студия",
    description: "Максимум творчества по лучшей цене"
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

/** Для сравнения на лендинге — ориентир Novely ~590₽/мес за ~30 генераций. */
export const COMPETITOR_MONTHLY_EQUIV_RUB = 590;
export const STORYSTUDIO_MONTHLY_EQUIV_RUB = 449;

export const STORY_PRICING_PLANS = [
  {
    id: "free",
    name: "Пробный",
    price: "0 ₽",
    period: "",
    features: [
      "1 история с AI-основой",
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
      "Дешевле Novely на ~34%",
      "Пакеты со скидкой до 41%"
    ],
    cta: "Купить генерации",
    highlighted: true
  },
  {
    id: "pack",
    name: "Пакет 50",
    price: formatStoryRub(1490),
    period: "≈ 30 ₽/ген",
    features: [
      "50 генераций любого типа",
      "Портреты персонажей включены",
      "Premium 18+ режим",
      "Приоритетная очередь"
    ],
    cta: "Выбрать пакет",
    highlighted: false
  }
] as const;
