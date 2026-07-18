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

  const isLayoutLock = /LAYOUT_LOCK_FROM_SAMPLE|1 в 1|как в образце|ту же композицию/i.test(
    editInstructions
  );

  if (isLayoutLock) {
    return `\n\nLAYOUT LOCK (highest priority — overrides default composition template):
${editInstructions.trim()}

CRITICAL IMAGE RULES:
- Clone the SAMPLE card's layout system almost 1:1.
- Keep the same block positions, badge style, typography density, spacing and overall art direction.
- Use the uploaded product photo as the ONLY product hero — do not invent another product.
- Replace texts/specs for the new product, but do not invent a different template or rearrange the grid.
- If the sample had a side specs column, keep a side specs column.
- If the sample had bottom badges, keep bottom badges in the same place.
- If the sample had detail thumbnails, keep a similar thumbnail strip — do not add a new unrelated collage style.`;
  }

  return `\n\nUSER EDIT REQUEST (must apply to the new image):
${editInstructions.trim()}
Use the uploaded product photo as the main subject — do not invent a different product. Keep the same overall layout, block structure and badge placement when the request asks to preserve the sample design. Update text and accents for the new product.`;
}
