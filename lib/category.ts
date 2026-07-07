const CATEGORY_RULES: Array<{ category: string; words: string[] }> = [
  {
    category: "\u0412\u043e\u0434\u043d\u044b\u0439 \u0442\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442",
    words: [
      "boat",
      "yacht",
      "marine",
      "\u043a\u0430\u0442\u0435\u0440",
      "\u043b\u043e\u0434\u043a",
      "\u044f\u0445\u0442",
      "\u0441\u0443\u0434\u043d",
      "\u0432\u043e\u0434\u043d",
      "\u043f\u0440\u0438\u0447\u0430\u043b",
      "\u043f\u0440\u043e\u0433\u0443\u043b\u043e\u0447"
    ]
  },
  { category: "Декор и интерьер", words: ["статуэт", "декор", "ваза", "свеч", "картина", "постер", "фигур"] },
  { category: "Электроника", words: ["наушник", "колонк", "заряд", "кабель", "смартфон", "лампа", "гаджет"] },
  { category: "Аксессуары", words: ["косметич", "сумк", "кошелек", "ремень", "чехол", "органайзер"] },
  { category: "Спорт и дом", words: ["бутыл", "термос", "коврик", "гантел", "спорт", "шейкер"] },
  { category: "Одежда и обувь", words: ["футболк", "худи", "плать", "кроссов", "ботин", "куртк"] },
  { category: "Красота и уход", words: ["крем", "сыворот", "шампун", "маск", "щетк", "уход"] },
  { category: "Детские товары", words: ["игруш", "детск", "ребен", "развива", "конструктор"] },
  { category: "Кухня", words: ["сковор", "нож", "тарел", "контейнер", "кухон", "чашк"] }
];

const PRODUCT_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /(\u043a\u0430\u0442\u0435\u0440|boat)/i, name: "\u043a\u0430\u0442\u0435\u0440" },
  { pattern: /(\u043b\u043e\u0434\u043a|yacht|\u044f\u0445\u0442)/i, name: "\u0432\u043e\u0434\u043d\u044b\u0439 \u0442\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442" },
  { pattern: /органайзер/i, name: "органайзер" },
  { pattern: /косметичк/i, name: "косметичка" },
  { pattern: /наушник/i, name: "наушники" },
  { pattern: /заряд/i, name: "зарядное устройство" },
  { pattern: /рюкзак/i, name: "рюкзак" },
  { pattern: /сумк/i, name: "сумка" },
  { pattern: /контейнер/i, name: "контейнер" },
  { pattern: /бутыл/i, name: "бутылка" },
  { pattern: /термос/i, name: "термос" }
];

export function detectCategory(description: string, category?: string) {
  const trimmedCategory = category?.trim();

  if (trimmedCategory) {
    return trimmedCategory;
  }

  const normalized = description.toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.words.some((word) => normalized.includes(word)));

  return match?.category ?? "Другое";
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
