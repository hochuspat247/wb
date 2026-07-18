import type { ProductCardResult, PreviousCardSnapshot } from "@/types/product-card";

export type { PreviousCardSnapshot };

export function buildPreviousCardSnapshot(card: ProductCardResult): PreviousCardSnapshot {
  return {
    title: card.title,
    shortDescription: card.shortDescription,
    fullDescription: card.fullDescription,
    benefits: card.benefits,
    characteristics: card.characteristics,
    infographicTexts: card.infographicTexts,
    visualConcept: card.visualConcept
  };
}

export function buildEditInstructionsBlock(editInstructions?: string, previous?: PreviousCardSnapshot) {
  if (!editInstructions?.trim()) {
    return "";
  }

  let block = `\n\nПравки от пользователя (обязательно учти):\n${editInstructions.trim()}`;

  if (previous) {
    block += `\n\nОбразец карточки (сохрани структуру блоков и стиль, обнови под новый товар):
Заголовок: ${previous.title}
Короткое описание: ${previous.shortDescription}
Полное описание: ${previous.fullDescription.slice(0, 500)}
Преимущества: ${previous.benefits.join("; ")}
Тексты для инфографики: ${previous.infographicTexts.join("; ")}
Визуальная концепция: ${previous.visualConcept}`;
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
