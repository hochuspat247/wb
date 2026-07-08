const PRIMARY_PRODUCT_RULES: Array<{ category: string; words: string[] }> = [
  {
    category: "Электроника",
    words: [
      "наушник",
      "headphone",
      "earphone",
      "earbud",
      "гарнитур",
      "колонк",
      "speaker",
      "заряд",
      "кабель",
      "смартфон",
      "phone",
      "лампа",
      "гаджет",
      "bluetooth",
      "беспроводн"
    ]
  },
  {
    category: "Продукты питания",
    words: ["шоколад", "конфет", "снек", "батончик", "печень", "чипс", "кофе", "чай", "напит", "молок", "сыр", "chocolate", "candy"]
  },
  { category: "Декор и интерьер", words: ["статуэт", "декор", "ваза", "свеч", "картина", "постер", "фигур"] },
  { category: "Аксессуары", words: ["косметич", "сумк", "кошелек", "ремень", "чехол", "органайзер"] },
  { category: "Спорт и дом", words: ["бутыл", "термос", "коврик", "гантел", "спорт", "шейкер"] },
  { category: "Одежда и обувь", words: ["футболк", "худи", "плать", "кроссов", "ботин", "куртк"] },
  { category: "Красота и уход", words: ["крем", "сыворот", "шампун", "маск", "щетк", "уход"] },
  { category: "Детские товары", words: ["игруш", "детск", "ребен", "развива", "конструктор"] },
  { category: "Кухня", words: ["сковор", "нож", "тарел", "контейнер", "кухон", "чашк"] }
];

const VESSEL_PRODUCT_RULES: Array<{ category: string; words: string[] }> = [
  {
    category: "Водный транспорт",
    words: [
      "катер",
      "лодк",
      "яхт",
      "boat",
      "yacht",
      "катамаран",
      "гидроцикл",
      "моторн лодк",
      "весельн лодк",
      "парусн яхт",
      "sup-доск",
      "sup доск"
    ]
  }
];

const PRODUCT_CATEGORY_OVERRIDES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /наушник|headphone|earphone|earbud|гарнитур/i, category: "Электроника" },
  { pattern: /шоколад|chocolate|конфет|candy|батончик/i, category: "Продукты питания" },
  { pattern: /(катер|лодк|яхт|boat|yacht|катамаран|гидроцикл)/i, category: "Водный транспорт" }
];

const PRODUCT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /наушник|headphone|earphone|earbud/i, name: "наушники" },
  { pattern: /(\u043a\u0430\u0442\u0435\u0440|boat)/i, name: "\u043a\u0430\u0442\u0435\u0440" },
  { pattern: /(\u043b\u043e\u0434\u043a|yacht|\u044f\u0445\u0442)/i, name: "\u0432\u043e\u0434\u043d\u044b\u0439 \u0442\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442" },
  { pattern: /органайзер/i, name: "органайзер" },
  { pattern: /косметичк/i, name: "косметичка" },
  { pattern: /заряд/i, name: "зарядное устройство" },
  { pattern: /рюкзак/i, name: "рюкзак" },
  { pattern: /сумк/i, name: "сумка" },
  { pattern: /контейнер/i, name: "контейнер" },
  { pattern: /бутыл/i, name: "бутылка" },
  { pattern: /термос/i, name: "термос" },
  { pattern: /шоколад/i, name: "шоколад" },
  { pattern: /(батончик|конфет|снек)/i, name: "сладость" }
];

function matchesAnyWord(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function detectCategoryFromRules(text: string) {
  for (const rule of PRIMARY_PRODUCT_RULES) {
    if (matchesAnyWord(text, rule.words)) {
      return rule.category;
    }
  }

  for (const rule of VESSEL_PRODUCT_RULES) {
    if (matchesAnyWord(text, rule.words)) {
      return rule.category;
    }
  }

  return "Другое";
}

export function resolveCategory(input: {
  description: string;
  productName?: string;
  productType?: string;
  category?: string;
}) {
  const explicitCategory = input.category?.trim();
  const identityText = `${input.productName ?? ""} ${input.productType ?? ""}`.trim().toLowerCase();
  const descriptionText = input.description.trim().toLowerCase();
  const combinedText = `${identityText} ${descriptionText}`.trim();

  for (const override of PRODUCT_CATEGORY_OVERRIDES) {
    if (override.pattern.test(identityText) || override.pattern.test(descriptionText)) {
      return override.category;
    }
  }

  if (explicitCategory) {
    const normalizedExplicit = explicitCategory.toLowerCase();

    if (
      /наушник|headphone|earphone|earbud|гарнитур/i.test(combinedText) &&
      /водн|транспорт|яхт|лодк|boat|yacht|причал/i.test(normalizedExplicit)
    ) {
      return "Электроника";
    }

    if (
      /шоколад|chocolate|конфет|candy/i.test(combinedText) &&
      /водн|транспорт|дрон|летат|полет/i.test(normalizedExplicit)
    ) {
      return "Продукты питания";
    }

    return explicitCategory;
  }

  const identityCategory = identityText ? detectCategoryFromRules(identityText) : "Другое";
  if (identityCategory !== "Другое") {
    return identityCategory;
  }

  return detectCategoryFromRules(descriptionText);
}

export function detectCategory(description: string, category?: string) {
  return resolveCategory({ description, category });
}

export function extractProductName(description: string) {
  const cleaned = description
    .replace(/[.,;:!?()[\]{}"'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "товар";
  }

  const matchedProduct = PRODUCT_PATTERNS.find((item) => item.pattern.test(cleaned));
  const normalized = cleaned.toLowerCase();

  if (matchedProduct?.name === "органайзер") {
    if (/космет|макияж|уход|кист/.test(normalized)) return "органайзер для косметики";
    if (/украшен|аксессуар/.test(normalized)) return "органайзер для аксессуаров";
    return "органайзер для хранения";
  }

  if (matchedProduct) {
    return matchedProduct.name;
  }

  const words = cleaned.split(" ").filter(Boolean);
  const stopWords = new Set([
    "для",
    "с",
    "со",
    "и",
    "или",
    "на",
    "в",
    "во",
    "из",
    "от",
    "под",
    "без",
    "новый",
    "новая",
    "новое",
    "стильный",
    "стильная",
    "удобный",
    "удобная",
    "красивый",
    "красивое",
    "крутой",
    "крутая",
    "крутое",
    "крутые",
    "крутых",
    "цель",
    "цели",
    "целей",
    "прочего",
    "прочее",
    "там",
    "куча",
    "поместится",
    "поместиться"
  ]);

  const meaningful = words.filter((word) => !stopWords.has(word.toLowerCase()));
  return (meaningful.slice(0, 3).join(" ") || words.slice(0, 3).join(" ")).toLowerCase();
}
