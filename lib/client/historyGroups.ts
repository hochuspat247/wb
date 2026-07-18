import { cleanProductName, getSeriesAnchorId } from "@/lib/series/plan";
import { SKU_KIT_SLIDE_COUNT } from "@/lib/pricing";
import type { ProductCardResult } from "@/types/product-card";

export type HistoryProductGroup = {
  id: string;
  title: string;
  cards: ProductCardResult[];
  coverCard: ProductCardResult;
  seriesCount: number;
  createdCount: number;
  isComplete: boolean;
  updatedAt: string;
};

export function groupCardsByProduct(cards: ProductCardResult[]): HistoryProductGroup[] {
  const buckets = new Map<string, ProductCardResult[]>();

  for (const card of cards) {
    const key = getSeriesAnchorId(card);
    const list = buckets.get(key) ?? [];
    list.push(card);
    buckets.set(key, list);
  }

  const groups: HistoryProductGroup[] = [];

  for (const [id, groupCards] of buckets) {
    const sorted = [...groupCards].sort((left, right) => {
      const leftIndex = left.seriesIndex ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = right.seriesIndex ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime();
    });
    const coverCard = sorted[0];
    const targetCount =
      coverCard.seriesCount ||
      sorted.find((card) => card.seriesCount)?.seriesCount ||
      (sorted.length > 1 ? Math.max(sorted.length, SKU_KIT_SLIDE_COUNT) : 1);
    const updatedAt = sorted.reduce(
      (latest, card) => (new Date(card.generatedAt) > new Date(latest) ? card.generatedAt : latest),
      sorted[0].generatedAt
    );

    groups.push({
      id,
      title: cleanProductName(coverCard.headline || coverCard.title || coverCard.shortDescription || "Товар"),
      cards: sorted,
      coverCard,
      seriesCount: targetCount,
      createdCount: sorted.length,
      isComplete: sorted.length >= targetCount && targetCount > 1,
      updatedAt
    });
  }

  return groups.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function getIncompleteKitGroup(cards: ProductCardResult[]) {
  return groupCardsByProduct(cards).find((group) => group.seriesCount > 1 && !group.isComplete) ?? null;
}

export function formatKitBalanceSummary(input: {
  freeRemaining: number;
  paidRemaining: number;
  unlimited?: boolean;
}) {
  if (input.unlimited) {
    return {
      headline: "Безлимит",
      detail: "Генерация серий без ограничения по балансу"
    };
  }

  const kitsApprox = Math.floor(input.paidRemaining / SKU_KIT_SLIDE_COUNT);
  const kitDetail =
    input.paidRemaining > 0
      ? kitsApprox > 0
        ? `Оплаченные слайды без метки: ${input.paidRemaining} · хватит примерно на ${kitsApprox} ${kitsApprox === 1 ? "комплект" : "комплекта"}`
        : `Оплаченные слайды без метки: ${input.paidRemaining}`
      : "Оплаченных слайдов пока нет";

  return {
    headline: String(input.freeRemaining + input.paidRemaining),
    detail:
      input.freeRemaining > 0
        ? `Пробные с меткой: ${input.freeRemaining} · ${kitDetail}`
        : kitDetail
  };
}
