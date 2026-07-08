import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards } from "@/lib/db/schema";
import { hydrateUserCardsWithVideos } from "@/lib/server/cardVideos";
import type { ProductCardResult } from "@/types/product-card";

const CARD_LIMIT = 50;

function normalizeCard(card: ProductCardResult): ProductCardResult | null {
  if (!card?.id || !card.title) {
    return null;
  }
  return card;
}

export async function getUserCards(userId: string) {
  const rows = await db
    .select()
    .from(productCards)
    .where(eq(productCards.userId, userId))
    .orderBy(desc(productCards.createdAt));

  return hydrateUserCardsWithVideos(
    userId,
    rows
      .map((row) => normalizeCard(row.payload))
      .filter((item): item is ProductCardResult => item !== null)
  );
}

export async function saveUserCard(userId: string, card: ProductCardResult) {
  const normalized = normalizeCard(card);
  if (!normalized) {
    throw new Error("INVALID_CARD");
  }

  await db
    .insert(productCards)
    .values({
      id: normalized.id,
      userId,
      payload: normalized,
      createdAt: new Date(normalized.generatedAt || Date.now())
    })
    .onConflictDoUpdate({
      target: productCards.id,
      set: {
        payload: normalized,
        createdAt: new Date(normalized.generatedAt || Date.now())
      }
    });

  const all = await getUserCards(userId);
  if (all.length <= CARD_LIMIT) {
    return all;
  }

  const toRemove = all.slice(CARD_LIMIT);
  for (const item of toRemove) {
    await db.delete(productCards).where(eq(productCards.id, item.id));
  }

  return getUserCards(userId);
}

export async function saveUserCardsBulk(userId: string, cards: ProductCardResult[]) {
  let latest: ProductCardResult[] = [];
  for (const card of cards) {
    latest = await saveUserCard(userId, card);
  }
  return latest;
}

export async function removeUserCard(userId: string, cardId: string) {
  await db.delete(productCards).where(eq(productCards.id, cardId));
  return getUserCards(userId);
}

export async function clearUserCards(userId: string) {
  await db.delete(productCards).where(eq(productCards.userId, userId));
}
