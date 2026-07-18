import type { ProductCardResult, PreviousCardSnapshot } from "@/types/product-card";

export type { PreviousCardSnapshot };

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function buildPreviousCardSnapshot(card: ProductCardResult): PreviousCardSnapshot {
  return {
    title: asText(card.title),
    shortDescription: asText(card.shortDescription),
    fullDescription: asText(card.fullDescription),
    benefits: asStringList(card.benefits),
    characteristics: Array.isArray(card.characteristics)
      ? card.characteristics
          .map((item) => ({
            key: asText(item?.key),
            value: asText(item?.value)
          }))
          .filter((item) => item.key || item.value)
      : [],
    infographicTexts: asStringList(card.infographicTexts),
    visualConcept: asText(card.visualConcept)
  };
}

export function normalizePreviousCardSnapshot(previous?: PreviousCardSnapshot | null): PreviousCardSnapshot | undefined {
  if (!previous || typeof previous !== "object") {
    return undefined;
  }

  return {
    title: asText(previous.title),
    shortDescription: asText(previous.shortDescription),
    fullDescription: asText(previous.fullDescription),
    benefits: asStringList(previous.benefits),
    characteristics: Array.isArray(previous.characteristics)
      ? previous.characteristics
          .map((item) => ({
            key: asText(item?.key),
            value: asText(item?.value)
          }))
          .filter((item) => item.key || item.value)
      : [],
    infographicTexts: asStringList(previous.infographicTexts),
    visualConcept: asText(previous.visualConcept)
  };
}

export function buildEditInstructionsBlock(editInstructions?: string, previous?: PreviousCardSnapshot | null) {
  if (!editInstructions?.trim()) {
    return "";
  }

  let block = `\n\nПравки от пользователя (обязательно учти):\n${editInstructions.trim()}`;
  const safePrevious = normalizePreviousCardSnapshot(previous);

  if (safePrevious) {
    block += `\n\nОбразец карточки (сохрани структуру блоков и стиль, обнови под новый товар):
Заголовок: ${safePrevious.title || "—"}
Короткое описание: ${safePrevious.shortDescription || "—"}
Полное описание: ${(safePrevious.fullDescription || "—").slice(0, 500)}
Преимущества: ${safePrevious.benefits.join("; ") || "—"}
Тексты для инфографики: ${safePrevious.infographicTexts.join("; ") || "—"}
Визуальная концепция: ${safePrevious.visualConcept || "—"}`;
  }

  return block;
}

export function buildImageEditInstructionsBlock(editInstructions?: string) {
  if (!editInstructions?.trim()) {
    return "";
  }

  return `\n\nUSER EDIT REQUEST (must apply to the new image):
${editInstructions.trim()}
Use the uploaded product photo as the main subject — do not invent a different product. Keep the same overall layout, block structure and badge placement when the request asks to preserve the sample design. Update text and accents for the new product.`;
}
