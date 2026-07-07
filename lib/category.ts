const CATEGORY_RULES: Array<{ category: string; words: string[] }> = [
  { category: "Декор и интерьер", words: ["статуэт", "декор", "ваза", "свеч", "картина", "постер", "фигур"] },
  { category: "Электроника", words: ["наушник", "колонк", "заряд", "кабель", "смартфон", "лампа", "гаджет"] },
  { category: "Аксессуары", words: ["косметич", "сумк", "кошелек", "ремень", "чехол", "органайзер"] },
  { category: "Спорт и дом", words: ["бутыл", "термос", "коврик", "гантел", "спорт", "шейкер"] },
  { category: "Одежда и обувь", words: ["футболк", "худи", "плать", "кроссов", "ботин", "куртк"] },
  { category: "Красота и уход", words: ["крем", "сыворот", "шампун", "маск", "щетк", "уход"] },
  { category: "Детские товары", words: ["игруш", "детск", "ребен", "развива", "конструктор"] },
  { category: "Кухня", words: ["сковор", "нож", "тарел", "контейнер", "кухон", "чашк"] }
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
    "красивое"
  ]);

  const meaningful = words.filter((word) => !stopWords.has(word.toLowerCase()));
  return (meaningful.slice(0, 3).join(" ") || words.slice(0, 3).join(" ")).toLowerCase();
}
