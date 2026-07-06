import { detectCategory, extractProductName } from "@/lib/category";
import type { ProductCardInput, ProductCardResult } from "@/types/product-card";

const STYLE_WORDS: Record<string, string> = {
  "Минималистичный": "лаконичной и чистой",
  "Премиальный": "премиальной и выразительной",
  "Яркий": "яркой и заметной",
  "Нежный": "мягкой и аккуратной",
  "Технологичный": "современной и технологичной"
};

const MARKETPLACE_TIPS: Record<string, string[]> = {
  Wildberries: [
    "Вынесите главный сценарий использования в первый экран карточки.",
    "Добавьте крупные инфографические подписи на фото.",
    "Проверьте, что название читается без лишних повторов ключей."
  ],
  Ozon: [
    "Разделите описание на короткие смысловые абзацы.",
    "Добавьте характеристики, которые помогают сравнить товар.",
    "Сделайте обложку контрастной, но без перегруза текстом."
  ],
  Avito: [
    "Сделайте акцент на состоянии, назначении и понятной выгоде.",
    "Используйте естественные поисковые фразы в описании.",
    "Добавьте призыв задать вопрос или уточнить детали."
  ],
  "Яндекс Маркет": [
    "Сформулируйте характеристики в нейтральном каталожном стиле.",
    "Уберите спорные обещания и неподтвержденные свойства.",
    "Подчеркните совместимость, комплектацию или сценарий применения."
  ]
};

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function keywordSet(productName: string, category: string, marketplace: string) {
  const name = productName.toLowerCase();
  return Array.from(
    new Set([
      name,
      `${name} купить`,
      `${name} ${category.toLowerCase()}`,
      `${name} ${marketplace}`,
      `товар ${category.toLowerCase()}`,
      `${name} для дома`,
      `${name} в подарок`,
      "подарок",
      "для дома"
    ])
  ).slice(0, 12);
}

export function buildFallbackCard(input: ProductCardInput): ProductCardResult {
  const category = detectCategory(input.productDescription, input.category);
  const productName = extractProductName(input.productDescription);
  const productLabel = sentenceCase(productName);
  const styleText = STYLE_WORDS[input.style] ?? "современной";
  const marketplace = input.marketplace || "Wildberries";

  const benefits = [
    getScenarioBenefit(productName, category),
    "Подходит для повседневного использования или подарка",
    "Легко показать назначение на первом фото",
    input.focusBenefits ? "Польза сформулирована без лишней воды" : "Описание без спорных обещаний",
    `Подача в ${styleText} стилистике`
  ];

  const characteristics = [
    { key: "Тип товара", value: productLabel },
    { key: "Категория", value: category },
    { key: "Маркетплейс", value: marketplace },
    { key: "Стиль подачи", value: input.style },
    { key: "Основа описания", value: input.productDescription.slice(0, 120) },
    { key: "Формат", value: "Карточка товара с SEO и инфографикой" }
  ];

  const infographicTexts = input.includeInfographicText
    ? getInfographicTexts(productName, category)
    : ["Крупное фото", "1:1 формат", "Без лишнего", "Для витрины"];

  const fullDescription = `${productLabel} подходит для ситуации, когда покупателю нужно быстро понять назначение товара и увидеть его пользу по первому фото карточки. Описание построено на основе введенных данных: ${input.productDescription}. Формулировки сделаны нейтрально, без неподтвержденных характеристик, медицинских обещаний и рекламных клише. В карточке можно показать сценарий использования, категорию "${category}", ключевые преимущества и короткие подписи для инфографики. Такой текст удобно использовать как основу для публикации на ${marketplace}, теста рекламного креатива или дальнейшей ручной доработки продавцом.`;

  return {
    id: crypto.randomUUID(),
    title: buildMarketplaceTitle(productLabel, category),
    shortDescription: `${productLabel}: понятное описание, выгоды и SEO-фразы для карточки на ${marketplace}.`,
    fullDescription,
    benefits,
    characteristics,
    keywords: input.includeSeo ? keywordSet(productName, category, marketplace) : keywordSet(productName, category, marketplace).slice(0, 6),
    infographicTexts,
    marketplaceTips: MARKETPLACE_TIPS[marketplace] ?? MARKETPLACE_TIPS.Wildberries,
    visualConcept: `Готовая картинка 1:1 для первого фото на ${marketplace}: загруженный товар крупно занимает 60-75% кадра, фон в ${input.style.toLowerCase()} стиле, сверху короткий заголовок, рядом 2 выгоды и 3-4 инфографические плашки без мелкого текста.`,
    category,
    marketplace,
    style: input.style,
    generatedAt: new Date().toISOString(),
    provider: "Smart fallback",
    isFallback: true
  };
}

function buildMarketplaceTitle(productLabel: string, category: string) {
  const categoryTail = category === "Товары для маркетплейса" ? "" : `, ${category.toLowerCase()}`;
  return `${productLabel}${categoryTail}, для дома и подарка`.slice(0, 120);
}

function getScenarioBenefit(productName: string, category: string) {
  if (category.includes("Электроника")) {
    return `${sentenceCase(productName)} для ежедневных задач`;
  }

  if (category.includes("Декор")) {
    return "Акцент для интерьера и подарка";
  }

  if (category.includes("Кухня")) {
    return "Практично для кухни и дома";
  }

  if (category.includes("Одежда")) {
    return "Легко сочетать в образе";
  }

  return `${sentenceCase(productName)} для понятного сценария`;
}

function getInfographicTexts(productName: string, category: string) {
  if (category.includes("Электроника")) {
    return ["На каждый день", "Удобный формат", "Для работы", "В подарок"];
  }

  if (category.includes("Декор")) {
    return ["Для интерьера", "На полку", "В подарок", "Стильный акцент"];
  }

  if (category.includes("Кухня")) {
    return ["Для кухни", "Каждый день", "Удобно дома", "Практично"];
  }

  const name = sentenceCase(productName).slice(0, 18);
  return [name, "1:1 фото", "Главная выгода", "Для витрины"];
}
