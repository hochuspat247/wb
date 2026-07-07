import { detectCategory, extractProductName } from "@/lib/category";
import { sanitizeKeywords, sanitizeProductCardResult } from "@/lib/contentQuality";
import type { ProductCardInput, ProductCardResult } from "@/types/product-card";

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

function keywordSet(productName: string, category: string) {
  const name = productName.toLowerCase();
  const categoryKeyword = category === "Другое" ? "" : category.toLowerCase();
  return sanitizeKeywords(
    Array.from(
      new Set([
        name,
        `${name} купить`,
        categoryKeyword ? `${name} ${categoryKeyword}` : "",
        `${name} для дома`,
        `${name} в подарок`,
        categoryKeyword ? `${categoryKeyword} для дома` : "",
        categoryKeyword ? `${categoryKeyword} в подарок` : "",
        "подарок",
        "для дома"
      ])
    ),
    productName
  ).slice(0, 12);
}

export function buildFallbackCard(input: ProductCardInput): ProductCardResult {
  const category = detectCategory(input.productDescription, input.category);
  const productName = extractProductName(input.productDescription);
  const productLabel = sentenceCase(productName);
  const marketplace = input.marketplace || "Wildberries";

  const benefits = [
    ...getFallbackBenefits(input, productLabel, category)
  ];

  const characteristics = [
    { key: "Тип товара", value: productLabel },
    { key: "Категория", value: category },
    { key: "Назначение", value: getScenarioBenefit(productName, category) },
    { key: "Стиль", value: input.style },
    { key: "Описание", value: input.productDescription.slice(0, 120) }
  ];

  const infographicTexts = input.includeInfographicText
    ? getInfographicTexts(productName, category)
    : ["Крупное фото", "1:1 формат", "Без лишнего", "Для витрины"];

  const fullDescription = buildFallbackDescription(input, productLabel, category);

  return sanitizeProductCardResult({
    id: crypto.randomUUID(),
    title: buildMarketplaceTitle(productLabel, category),
    shortDescription: `${productLabel} для понятной задачи, ежедневного использования или подарка.`,
    fullDescription,
    benefits,
    characteristics,
    keywords: input.includeSeo ? keywordSet(productName, category) : keywordSet(productName, category).slice(0, 6),
    infographicTexts,
    marketplaceTips: MARKETPLACE_TIPS[marketplace] ?? MARKETPLACE_TIPS.Wildberries,
    visualConcept: `Готовая картинка 1:1 для первого фото на ${marketplace}: загруженный товар крупно занимает 60-75% кадра, фон в ${input.style.toLowerCase()} стиле, сверху короткий заголовок, рядом 2 выгоды и 3-4 инфографические плашки без мелкого текста.`,
    category,
    marketplace,
    style: input.style,
    generatedAt: new Date().toISOString(),
    provider: "Smart fallback",
    isFallback: true
  }, input);
}

function buildMarketplaceTitle(productLabel: string, category: string) {
  const categoryTail = category === "Другое" ? "" : `, ${category.toLowerCase()}`;
  return `${productLabel}${categoryTail}, для дома и подарка`.slice(0, 120);
}

function buildFallbackDescription(input: ProductCardInput, productLabel: string, category: string) {
  const lower = `${input.productDescription} ${category}`.toLowerCase();

  if (lower.includes("органайзер")) {
    return `${productLabel} помогает навести порядок в косметике, украшениях и небольших аксессуарах. Несколько зон хранения позволяют разложить вещи по категориям, быстрее находить нужное и освободить место на столе или полке. Такой органайзер удобно поставить в ванной, спальне, гардеробной или на рабочем месте. ${input.color ? `Цвет: ${input.color}.` : ""} ${input.material ? `Материал: ${input.material}.` : ""}`.trim();
  }

  return `${productLabel} подходит для повседневного использования и помогает быстро решить привычную задачу. ${input.useCase ? `Сценарий использования: ${input.useCase}.` : "Подойдёт для дома, работы, поездок или подарка."} ${input.packageContents ? `Комплектация: ${input.packageContents}.` : ""} ${input.material ? `Материал: ${input.material}.` : ""} ${input.color ? `Цвет: ${input.color}.` : ""}`.trim();
}

function getFallbackBenefits(input: ProductCardInput, productLabel: string, category: string) {
  const lower = `${input.productDescription} ${category}`.toLowerCase();

  if (lower.includes("органайзер")) {
    return [
      "Аккуратное хранение косметики и аксессуаров",
      "Отделения помогают быстро находить нужное",
      "Подходит для ванной, спальни или туалетного столика",
      "Мелочи остаются под рукой и не теряются",
      "Удобный вариант для себя или подарка"
    ];
  }

  return [
    getScenarioBenefit(productLabel, category),
    "Подходит для повседневного использования или подарка",
    input.useCase ? `Удобно для сценария: ${input.useCase}` : "Удобно держать под рукой каждый день",
    input.packageContents ? `В комплекте: ${input.packageContents}` : "Легко вписать в ежедневные задачи",
    input.material ? `Материал: ${input.material}` : "Подходит для разных повседневных сценариев"
  ];
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
  return [name, "Для дома", "В подарок", "Каждый день"];
}
