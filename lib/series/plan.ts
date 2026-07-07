import type { CardSeriesCount, CardSeriesPlanItem, ProductCardInput, ProductCardResult } from "@/types/product-card";

export function cleanProductName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Карточка товара";
  return trimmed.split(/[.,;\n]/)[0]?.slice(0, 48) || "Карточка товара";
}

export function getSeriesTypeOrder(count: CardSeriesCount, category: string) {
  const normalizedCategory = category.toLowerCase();
  const base: Record<CardSeriesCount, string[]> = {
    1: ["hero"],
    3: ["hero", "benefits", "features"],
    5: ["hero", "benefits", "features", "how_to_use", "safety"],
    7: ["hero", "benefits", "features", "how_to_use", "safety", "compatibility", "assortment"],
    10: [
      "hero",
      "benefits",
      "features",
      "ingredients",
      "how_to_use",
      "use_cases",
      "safety",
      "compatibility",
      "assortment",
      "final_cta"
    ]
  };

  if (/космет|крем|сыворот|уход|шампун|маск/.test(normalizedCategory) && count === 10) {
    return ["hero", "benefits", "ingredients", "how_to_use", "texture", "skin_type", "safety", "use_cases", "assortment", "final_cta"];
  }

  if (/живот|кош|собак|питом/.test(normalizedCategory) && count >= 7) {
    return base[count].map((type) => (type === "compatibility" ? "hygiene" : type));
  }

  if (/электрон|гаджет|науш|телефон|техник/.test(normalizedCategory) && count === 10) {
    return ["hero", "key_specs", "benefits", "use_cases", "comparison", "compatibility", "package", "warranty", "dimensions", "final_cta"];
  }

  if (/одеж|плать|брюк|футбол|кофт|обув/.test(normalizedCategory) && count === 10) {
    return ["hero", "material", "fit", "sizes", "styling", "details", "care", "colors", "review", "final_cta"];
  }

  return base[count];
}

export function getDefaultSeriesTypes(count: CardSeriesCount, category: string) {
  return getSeriesTypeOrder(count, category);
}

export function getAvailableSeriesTypes(category: string) {
  const counts: CardSeriesCount[] = [10, 7, 5, 3];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const count of counts) {
    for (const type of getSeriesTypeOrder(count, category)) {
      if (!seen.has(type)) {
        seen.add(type);
        result.push(type);
      }
    }
  }

  return result;
}

export function getSeriesTypeLabel(type: string, marketplace = "Wildberries", style = "Премиальный") {
  return getSeriesDefinition(type, "Товар", marketplace, style).title;
}

export function getSeriesTypeDescription(type: string, marketplace = "Wildberries", style = "Премиальный") {
  return getSeriesDefinition(type, "Товар", marketplace, style).goal;
}

function getSeriesDefinition(
  type: string,
  productName: string,
  marketplace: string,
  style: string
): Omit<CardSeriesPlanItem, "index" | "type"> {
  const definitions: Record<string, Omit<CardSeriesPlanItem, "index" | "type">> = {
    hero: {
      title: "Главная обложка",
      goal: "Быстро объяснить, что это за товар и почему его стоит открыть.",
      mainHeadline: productName,
      subheadline: `Продающая обложка для ${marketplace}`,
      bullets: ["Крупный товар", "Понятный первый экран", "Акцент на главной выгоде"],
      badges: ["Хит для каталога", style],
      visualIdea: "Крупное фото товара, чистый фон, один сильный заголовок и 2-3 аккуратные плашки",
      textDensity: "medium"
    },
    benefits: {
      title: "Преимущества",
      goal: "Показать покупателю главные выгоды без повторения обложки.",
      mainHeadline: "Главные преимущества",
      subheadline: "Почему товар удобно выбрать",
      bullets: ["Понятная польза", "Удобство в использовании", "Подходит для ежедневных задач"],
      badges: ["Польза", "Комфорт"],
      visualIdea: "Товар в центре, вокруг крупные иконки преимуществ и короткие подписи",
      textDensity: "medium"
    },
    features: {
      title: "Характеристики",
      goal: "Собрать важные свойства товара в читаемый блок.",
      mainHeadline: "Характеристики без лишнего",
      subheadline: "Ключевые параметры в одном кадре",
      bullets: ["Материал / состав", "Размер / формат", "Комплектация"],
      badges: ["Параметры", "Детали"],
      visualIdea: "Структурная карточка с товаром сбоку и блоком характеристик крупным текстом",
      textDensity: "high"
    },
    ingredients: {
      title: "Состав / материалы",
      goal: "Показать состав, материалы или комплектацию без неподтвержденных обещаний.",
      mainHeadline: "Состав и детали",
      subheadline: "Что важно знать перед покупкой",
      bullets: ["Материалы", "Комплектация", "Особенности"],
      badges: ["Состав", "Детали"],
      visualIdea: "Крупный товар, рядом аккуратные карточки материалов или элементов комплекта",
      textDensity: "medium"
    },
    how_to_use: {
      title: "Применение",
      goal: "Показать, как пользоваться товаром или в каком сценарии он нужен.",
      mainHeadline: "Как использовать",
      subheadline: "Простой сценарий для покупателя",
      bullets: ["Шаг 1", "Шаг 2", "Готовый результат"],
      badges: ["Инструкция", "Просто"],
      visualIdea: "Пошаговая композиция с крупными цифрами и товаром в действии",
      textDensity: "medium"
    },
    use_cases: {
      title: "Сценарии использования",
      goal: "Показать несколько ситуаций, где товар может быть полезен.",
      mainHeadline: "Для разных задач",
      subheadline: "Сценарии использования",
      bullets: ["Дом", "Работа", "Подарок"],
      badges: ["Сценарии", "Универсально"],
      visualIdea: "Три аккуратных мини-сцены вокруг главного товара",
      textDensity: "medium"
    },
    safety: {
      title: "Доверие / безопасность",
      goal: "Дать спокойный аргумент качества без фейковых сертификатов и гарантий.",
      mainHeadline: "Качество без лишних обещаний",
      subheadline: "Понятные факты перед покупкой",
      bullets: ["Материалы и уход", "Комплектация без сюрпризов", "Подходит для ежедневного использования"],
      badges: ["Доверие", "Качество"],
      visualIdea: "Чистая премиальная карточка с товаром, отметками качества и спокойной палитрой",
      textDensity: "low"
    },
    compatibility: {
      title: "Кому подходит",
      goal: "Показать совместимость, аудиторию или ситуации выбора.",
      mainHeadline: "Кому подойдет",
      subheadline: "Быстрый ответ перед покупкой",
      bullets: ["Для выбранной категории", "Для повседневного использования", "Для подарка"],
      badges: ["Совместимость", "Выбор"],
      visualIdea: "Товар в центре, рядом 3 портретных или ситуационных блока без лишних деталей",
      textDensity: "medium"
    },
    assortment: {
      title: "Ассортимент / варианты",
      goal: "Показать варианты цвета, размера, объема или финальный аргумент серии.",
      mainHeadline: "Выберите свой вариант",
      subheadline: "Цвет, размер или формат под вашу задачу",
      bullets: ["Цвет", "Размер", "Формат"],
      badges: ["Варианты", "Ассортимент"],
      visualIdea: "Единая композиция с несколькими вариантами товара или аккуратными свотчами",
      textDensity: "medium"
    },
    final_cta: {
      title: "Финальная карточка",
      goal: "Закрыть галерею мягким аргументом покупки без агрессивного CTA.",
      mainHeadline: "Готово для вашего заказа",
      subheadline: "Финальный акцент серии",
      bullets: ["Сравните параметры", "Выберите подходящий вариант", "Добавьте в корзину"],
      badges: ["Финал", "Выбор"],
      visualIdea: "Премиальная финальная карточка с товаром, благодарностью и спокойным завершающим блоком",
      textDensity: "low"
    },
    hygiene: {
      title: "Гигиена и уход",
      goal: "Показать уход и гигиену без медицинских обещаний.",
      mainHeadline: "Уход и гигиена",
      subheadline: "Понятные рекомендации",
      bullets: ["Простой уход", "Безопасное использование", "Для ежедневного применения"],
      badges: ["Уход", "Гигиена"],
      visualIdea: "Чистая карточка с товаром и иконками ухода",
      textDensity: "medium"
    },
    key_specs: {
      title: "Ключевые характеристики",
      goal: "Выделить главные технические параметры.",
      mainHeadline: "Главные параметры",
      subheadline: "Что важно знать",
      bullets: ["Мощность / объём", "Совместимость", "Комплектация"],
      badges: ["Характеристики", "Техника"],
      visualIdea: "Технологичная карточка с крупными цифрами и товаром",
      textDensity: "high"
    },
    comparison: {
      title: "Сравнение",
      goal: "Показать преимущества без агрессивного сравнения с конкурентами.",
      mainHeadline: "Почему этот вариант",
      subheadline: "Ключевые отличия",
      bullets: ["Удобство", "Функции", "Комплектация"],
      badges: ["Выбор", "Сравнение"],
      visualIdea: "Таблица или колонки с акцентами вокруг товара",
      textDensity: "medium"
    },
    package: {
      title: "Комплектация",
      goal: "Показать, что входит в набор.",
      mainHeadline: "Что в комплекте",
      subheadline: "Полная комплектация",
      bullets: ["Основной товар", "Аксессуары", "Документация"],
      badges: ["Комплект", "Всё включено"],
      visualIdea: "Разложенная комплектация вокруг главного товара",
      textDensity: "medium"
    },
    warranty: {
      title: "Гарантия и поддержка",
      goal: "Спокойно рассказать о гарантии без юридических обещаний.",
      mainHeadline: "Поддержка покупателя",
      subheadline: "Спокойная покупка",
      bullets: ["Понятные условия", "Поддержка", "Качество"],
      badges: ["Гарантия", "Доверие"],
      visualIdea: "Премиальная карточка с иконками доверия",
      textDensity: "low"
    },
    dimensions: {
      title: "Размеры и габариты",
      goal: "Показать размеры и габариты товара.",
      mainHeadline: "Размеры",
      subheadline: "Габариты и формат",
      bullets: ["Ширина", "Высота", "Глубина"],
      badges: ["Размеры", "Габариты"],
      visualIdea: "Товар с линиями размеров и подписями",
      textDensity: "high"
    },
    texture: {
      title: "Текстура и формула",
      goal: "Показать текстуру или формулу без медицинских обещаний.",
      mainHeadline: "Текстура и ощущения",
      subheadline: "Как ощущается продукт",
      bullets: ["Лёгкая текстура", "Комфорт", "Приятные ощущения"],
      badges: ["Текстура", "Формула"],
      visualIdea: "Макро-текстура и товар на нежном фоне",
      textDensity: "medium"
    },
    skin_type: {
      title: "Тип кожи",
      goal: "Подсказать, кому подойдёт продукт.",
      mainHeadline: "Для какого типа кожи",
      subheadline: "Подбор по типу",
      bullets: ["Нормальная", "Сухая", "Комбинированная"],
      badges: ["Тип кожи", "Подбор"],
      visualIdea: "Товар и мягкие портретные акценты",
      textDensity: "medium"
    },
    material: {
      title: "Материал",
      goal: "Показать материал и качество исполнения.",
      mainHeadline: "Материал и качество",
      subheadline: "Из чего сделано",
      bullets: ["Состав ткани", "Плотность", "Уход"],
      badges: ["Материал", "Качество"],
      visualIdea: "Макро-текстура материала рядом с товаром",
      textDensity: "medium"
    },
    fit: {
      title: "Посадка",
      goal: "Показать, как сидит изделие.",
      mainHeadline: "Посадка и силуэт",
      subheadline: "Как сидит",
      bullets: ["Свободная", "По фигуре", "Универсальная"],
      badges: ["Посадка", "Силуэт"],
      visualIdea: "Модель или манекен с акцентом на посадку",
      textDensity: "medium"
    },
    sizes: {
      title: "Размерная сетка",
      goal: "Помочь выбрать размер.",
      mainHeadline: "Размерная сетка",
      subheadline: "Как выбрать размер",
      bullets: ["XS–XL", "Таблица размеров", "Советы по выбору"],
      badges: ["Размеры", "Сетка"],
      visualIdea: "Таблица размеров и товар",
      textDensity: "high"
    },
    styling: {
      title: "Стилизация",
      goal: "Показать образы и сочетания.",
      mainHeadline: "Образы и стилизация",
      subheadline: "С чем носить",
      bullets: ["Повседневный", "Офис", "Вечерний"],
      badges: ["Стиль", "Образ"],
      visualIdea: "Лукбук-коллаж с товаром",
      textDensity: "medium"
    },
    details: {
      title: "Детали",
      goal: "Показать важные детали изделия.",
      mainHeadline: "Детали и отделка",
      subheadline: "На что обратить внимание",
      bullets: ["Фурнитура", "Швы", "Отделка"],
      badges: ["Детали", "Качество"],
      visualIdea: "Макро-детали крупным планом",
      textDensity: "medium"
    },
    care: {
      title: "Уход",
      goal: "Рассказать, как ухаживать за изделием.",
      mainHeadline: "Уход за изделием",
      subheadline: "Как сохранить вид",
      bullets: ["Стирка", "Сушка", "Хранение"],
      badges: ["Уход", "Советы"],
      visualIdea: "Иконки ухода и товар",
      textDensity: "medium"
    },
    colors: {
      title: "Цвета",
      goal: "Показать доступные цвета.",
      mainHeadline: "Доступные цвета",
      subheadline: "Выберите оттенок",
      bullets: ["Базовые", "Яркие", "Нейтральные"],
      badges: ["Цвета", "Оттенки"],
      visualIdea: "Свотчи цветов и товар",
      textDensity: "medium"
    },
    review: {
      title: "Отзывы и доверие",
      goal: "Социальное доказательство без фейковых отзывов.",
      mainHeadline: "Почему выбирают",
      subheadline: "Доверие покупателей",
      bullets: ["Популярный выбор", "Удобство", "Качество"],
      badges: ["Отзывы", "Доверие"],
      visualIdea: "Карточка с акцентами доверия и товаром",
      textDensity: "low"
    }
  };

  return (
    definitions[type] ?? {
      title: "Смысловой блок",
      goal: "Раскрыть товар с новой стороны.",
      mainHeadline: "Новый аргумент",
      subheadline: "Отдельный блок серии",
      bullets: ["Польза", "Детали", "Выбор"],
      badges: ["Серия", style],
      visualIdea: "Единая карточка серии с товаром и одним главным сообщением",
      textDensity: "medium"
    }
  );
}

export function buildCardSeriesPlan({
  count,
  category,
  marketplace,
  style,
  productDescription,
  headline
}: {
  count: CardSeriesCount;
  category: string;
  marketplace: string;
  style: string;
  productDescription: string;
  headline: string;
}): CardSeriesPlanItem[] {
  return buildCardSeriesPlanFromTypes(getSeriesTypeOrder(count, category), {
    category,
    marketplace,
    style,
    productDescription,
    headline
  });
}

export function buildCardSeriesPlanFromTypes(
  selectedTypes: string[],
  {
    marketplace,
    style,
    productDescription,
    headline
  }: {
    category: string;
    marketplace: string;
    style: string;
    productDescription: string;
    headline: string;
  }
): CardSeriesPlanItem[] {
  const productName = cleanProductName(headline || productDescription);

  return selectedTypes.map((type, index) => {
    const definition = getSeriesDefinition(type, productName, marketplace, style);

    return {
      index: index + 1,
      type,
      ...definition
    };
  });
}

export function buildSeriesStyleGuide(style: string, marketplace: string) {
  return `${style} e-commerce стиль для ${marketplace}: единая палитра, крупная русская типографика, похожие плашки, аккуратные отступы, премиальная карточка 4:5.`;
}

export function buildSeriesCardDescription(
  payload: ProductCardInput,
  planItem: CardSeriesPlanItem,
  seriesCount: number
) {
  return `${payload.productDescription}

Сделай карточку серии ${planItem.index} из ${seriesCount}.
Тип блока: ${planItem.type}.
Название блока: ${planItem.title}.
Цель: ${planItem.goal}.
Главный заголовок: ${planItem.mainHeadline}.
Подзаголовок: ${planItem.subheadline}.
Тезисы: ${planItem.bullets.join("; ")}.
Бейджи: ${planItem.badges.join("; ")}.
Визуальная идея: ${planItem.visualIdea}.
Важно: не повторяй смысл других карточек серии, не придумывай неподтвержденные свойства, пиши коротко и на русском.`;
}

export function buildSeriesInfographicTexts(planItem: CardSeriesPlanItem) {
  return [planItem.mainHeadline, ...planItem.badges, ...planItem.bullets].filter(Boolean).slice(0, 4);
}

export function buildFailedSeriesCard(
  payload: ProductCardInput,
  planItem: CardSeriesPlanItem,
  seriesId: string,
  seriesCount: number,
  imageDataUrl: string,
  error: string
): ProductCardResult {
  return {
    id: crypto.randomUUID(),
    title: planItem.mainHeadline,
    shortDescription: planItem.subheadline,
    fullDescription: planItem.goal,
    benefits: planItem.bullets,
    characteristics: [],
    keywords: [],
    infographicTexts: buildSeriesInfographicTexts(planItem),
    marketplaceTips: [],
    visualConcept: planItem.visualIdea,
    category: payload.category || "",
    marketplace: payload.marketplace,
    style: payload.style,
    generatedAt: new Date().toISOString(),
    provider: "Series plan",
    isFallback: true,
    imageDataUrl,
    generatedImageIsFallback: true,
    generatedImageError: error,
    platform: payload.platform,
    textMode: payload.textMode,
    sourceInput: {
      ...payload,
      cardsCount: seriesCount as CardSeriesCount,
      seriesIndex: planItem.index,
      seriesType: planItem.type
    },
    seriesId,
    seriesIndex: planItem.index,
    seriesCount: seriesCount as CardSeriesCount,
    seriesPlanItem: planItem,
    seriesStyleGuide: buildSeriesStyleGuide(payload.style, payload.marketplace)
  };
}

export function sortSeriesTypes(types: string[], category: string) {
  const catalog = getAvailableSeriesTypes(category);
  return [...types].sort((left, right) => catalog.indexOf(left) - catalog.indexOf(right));
}
