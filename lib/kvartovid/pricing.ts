/** Тарифы КвартоВид. */

export const KVARTOVID_FREE_LISTINGS = 1;

export const KVARTOVID_PRICES = {
  listing: 99,
  listingWithCover: 149,
  listingWithVideo: 249,
  pack10: 990,
  realtorMin: 1490,
  realtorMax: 2990
} as const;

export type KvartovidPricingPlan = {
  id: string;
  label: string;
  priceRub: number;
  priceLabel: string;
  description: string;
  badge?: string;
  features: string[];
  soon?: boolean;
};

export const KVARTOVID_PRICING_PLANS: KvartovidPricingPlan[] = [
  {
    id: "free",
    label: "Пробный",
    priceRub: 0,
    priceLabel: "Бесплатно",
    description: "1 объявление с водяным знаком на обложке",
    features: ["Тексты для Авито, Циан и Домклик", "Список преимуществ", "Обложка с водяным знаком"]
  },
  {
    id: "listing",
    label: "1 объект",
    priceRub: KVARTOVID_PRICES.listing,
    priceLabel: "99 ₽",
    description: "Полный текст объявления без водяного знака",
    badge: "MVP",
    features: ["Тексты под 3 площадки", "Преимущества объекта", "Экспорт текста"]
  },
  {
    id: "cover",
    label: "Объект + обложка",
    priceRub: KVARTOVID_PRICES.listingWithCover,
    priceLabel: "149 ₽",
    description: "Тексты и AI-обложка для площадок",
    badge: "Популярный",
    features: ["Всё из тарифа «1 объект»", "AI-обложка с плашкой", "Скачивание PNG"]
  },
  {
    id: "realtor",
    label: "Пакет риэлтора",
    priceRub: KVARTOVID_PRICES.pack10,
    priceLabel: "990 ₽",
    description: "10 объектов — для агентов с потоком квартир",
    features: ["10 упаковок объявлений", "Обложки и тексты", "История объектов"],
    soon: true
  }
];

export function formatKvartovidRub(amount: number) {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export type KvartovidPaidPlanId = "listing" | "cover" | "realtor";

export function getKvartovidPlanCheckout(planId: KvartovidPaidPlanId) {
  if (planId === "listing") {
    return {
      amountRub: KVARTOVID_PRICES.listing,
      credits: 1,
      description: "КвартоВид: объявление без водяного знака"
    };
  }

  if (planId === "cover") {
    return {
      amountRub: KVARTOVID_PRICES.listingWithCover,
      credits: 1,
      description: "КвартоВид: объявление с AI-обложкой"
    };
  }

  return {
    amountRub: KVARTOVID_PRICES.pack10,
    credits: 10,
    description: "КвартоВид: пакет из 10 объявлений"
  };
}
