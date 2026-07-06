import type { MarketplacePlatform, MarketplaceTextMode } from "@/types/marketplace";

export type PlatformProfile = {
  platform: MarketplacePlatform;
  displayName: string;
  titleRules: string[];
  descriptionRules: string[];
  imageTextRules: string[];
  forbiddenTitleWords: string[];
  forbiddenSafeImageWords: string[];
  exportChecklistBase: string[];
  modeHints: Record<MarketplaceTextMode, string>;
};

const WB_FORBIDDEN_TITLE = ["лучший", "топ", "хит", "скидка", "акция", "распродажа"];
const WB_FORBIDDEN_SAFE_IMAGE = ["хит", "лучший", "топ", "скидка", "цена", "купить", "заказать", "акция", "распродажа"];
const YANDEX_FORBIDDEN_SAFE_IMAGE = ["хит", "лучший", "топ", "скидка", "цена", "купить", "заказать", "акция", "распродажа", "контакт"];

export const PLATFORM_PROFILES: Record<MarketplacePlatform, PlatformProfile> = {
  wildberries: {
    platform: "wildberries",
    displayName: "Wildberries",
    titleRules: [
      "Генерировать короткое точное наименование",
      "Название не должно быть перегружено SEO",
      "Не использовать эмодзи",
      "Не добавлять цену в название"
    ],
    descriptionRules: [
      "Описание без воды, по делу",
      "Характеристики по категории товара",
      "Преимущества товара без спорных обещаний",
      "Подсказки по качеству карточки"
    ],
    imageTextRules: [
      "В marketplace_safe не использовать цену, скидку и CTA на фото",
      "wbSafeImageTexts — короткие фразы о свойствах товара",
      "В promo_creative можно продающие плашки, но пометить как не safe для модерации"
    ],
    forbiddenTitleWords: WB_FORBIDDEN_TITLE,
    forbiddenSafeImageWords: WB_FORBIDDEN_SAFE_IMAGE,
    exportChecklistBase: [
      "Проверить длину названия WB",
      "Убрать запрещённые слова из названия и фото",
      "Сверить характеристики с реальным товаром",
      "Проверить фото на белом/нейтральном фоне",
      "Убедиться, что нет цены и CTA на главном фото"
    ],
    modeHints: {
      marketplace_safe: "Только нейтральные тексты для инфографики, без цены, скидок и CTA",
      promo_creative: "Можно продающие плашки, но это не safe-режим для модерации WB",
      seo: "Дополнительные SEO-фразы в keywords и seoTitle, без перегруза title",
      full_listing: "Полный набор полей WB: название, описание, характеристики, safe-тексты"
    }
  },

  ozon: {
    platform: "ozon",
    displayName: "Ozon",
    titleRules: [
      "Генерировать более подробное информативное название",
      "Название должно быть понятным и товарным",
      "Не делать слишком короткое описание"
    ],
    descriptionRules: [
      "Акцент на аннотации и полном описании",
      "Rich-content блоки: заголовок + текст",
      "Блоки «почему стоит купить», «сценарии использования», «что в комплекте»",
      "Структурировать характеристики"
    ],
    imageTextRules: [
      "Рекомендации по медиа и инфографике",
      "ozonMediaTips объясняют, какие изображения добавить"
    ],
    forbiddenTitleWords: [],
    forbiddenSafeImageWords: [],
    exportChecklistBase: [
      "Заполнить аннотацию и полное описание",
      "Добавить rich-content блоки",
      "Проверить характеристики по категории Ozon",
      "Подготовить фото и инфографику по медиа-рекомендациям"
    ],
    modeHints: {
      marketplace_safe: "Нейтральные формулировки без агрессивного промо",
      promo_creative: "Продающие блоки rich-content с акцентом на выгоды",
      seo: "Расширенные keywords и seoTitle для поиска на Ozon",
      full_listing: "Полная карточка: аннотация, описание, rich-content, характеристики"
    }
  },

  avito: {
    platform: "avito",
    displayName: "Avito",
    titleRules: [
      "Генерировать как объявление, не как карточку маркетплейса",
      "Заголовок живой и понятный",
      "Не слишком официальный маркетинговый текст"
    ],
    descriptionRules: [
      "Стиль человеческий и понятный",
      "Можно цену, выгоды, CTA и прямую продажу",
      "Блок «что написать покупателю»",
      "Частые вопросы и ответы"
    ],
    imageTextRules: [
      "На Avito допустимы цена и CTA в тексте объявления",
      "Фото должно показывать реальный товар"
    ],
    forbiddenTitleWords: [],
    forbiddenSafeImageWords: [],
    exportChecklistBase: [
      "Проверить заголовок объявления",
      "Указать цену и условия доставки/самовывоза",
      "Добавить CTA для связи",
      "Подготовить ответы на частые вопросы"
    ],
    modeHints: {
      marketplace_safe: "Честное объявление без преувеличений",
      promo_creative: "Более цепкий заголовок и CTA",
      seo: "Естественные поисковые фразы в описании",
      full_listing: "Полное объявление: заголовок, описание, цена, FAQ, CTA"
    }
  },

  yandex_market: {
    platform: "yandex_market",
    displayName: "Яндекс Маркет",
    titleRules: [
      "Название: тип товара + бренд/модель + важные характеристики",
      "Информативное, но не перегруженное",
      "Не перегружать title ключами"
    ],
    descriptionRules: [
      "Описание и характеристики в каталожном стиле",
      "Акцент на понятных характеристиках и структуре",
      "Подсказки по качеству карточки"
    ],
    imageTextRules: [
      "В marketplace_safe не использовать цены, скидки, контакты, CTA на фото",
      "yandexSafeImageTexts — короткие нейтральные фразы",
      "yandexForbiddenImageTexts — что нельзя писать на фото"
    ],
    forbiddenTitleWords: ["лучший", "топ", "хит"],
    forbiddenSafeImageWords: YANDEX_FORBIDDEN_SAFE_IMAGE,
    exportChecklistBase: [
      "Проверить информативность названия",
      "Сверить характеристики с товаром",
      "Убрать цену и CTA с фото в safe-режиме",
      "Подготовить нейтральные тексты для инфографики"
    ],
    modeHints: {
      marketplace_safe: "Нейтральные safe-тексты для фото без цен и CTA",
      promo_creative: "Продающие плашки с предупреждением о правилах площадки",
      seo: "SEO-оптимизация keywords без перегруза названия",
      full_listing: "Полная карточка: название, описание, характеристики, safe-тексты"
    }
  }
};

export function getPlatformProfile(platform: MarketplacePlatform): PlatformProfile {
  return PLATFORM_PROFILES[platform];
}
