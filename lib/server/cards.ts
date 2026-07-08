import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards } from "@/lib/db/schema";
import { hydrateUserCardsWithVideos } from "@/lib/server/cardVideos";
import {
  getUserDownloadAccess,
  isGenerationDownloadUnlocked,
  registerGenerationForCleanDownload
} from "@/lib/server/downloadAccess";
import type { ProductCardResult } from "@/types/product-card";

const CARD_LIMIT = 50;

function normalizeCard(card: ProductCardResult): ProductCardResult | null {
  if (!card?.id || !card.title) {
    return null;
  }
  return card;
}

function sanitizeCardForClient(
  card: ProductCardResult,
  access: Awaited<ReturnType<typeof getUserDownloadAccess>>
): ProductCardResult {
  const downloadUnlocked = isGenerationDownloadUnlocked(access, card.id);
  const previewImageUrl = `/api/cards/${card.id}/image?variant=preview`;
  const imageDownloadUrl = downloadUnlocked ? `/api/cards/${card.id}/image?variant=original` : undefined;

  if (downloadUnlocked) {
    return {
      ...card,
      downloadUnlocked: true,
      watermarkLocked: false,
      previewImageUrl,
      imageDownloadUrl
    };
  }

  return {
    ...card,
    generatedImageBase64: null,
    generatedImageDataUrl: undefined,
    generatedImageUrl: null,
    downloadUnlocked: false,
    watermarkLocked: true,
    previewImageUrl,
    imageDownloadUrl
  };
}

export async function getUserCards(userId: string): Promise<ProductCardResult[]> {
  const rows = await db
    .select()
    .from(productCards)
    .where(eq(productCards.userId, userId))
    .orderBy(desc(productCards.createdAt));

  const cards = await hydrateUserCardsWithVideos(
    userId,
    rows
      .map((row) => normalizeCard(row.payload))
      .filter((item): item is ProductCardResult => item !== null)
  );

  const access = await getUserDownloadAccess(userId);
  return cards.map((card) => sanitizeCardForClient(card, access));
}

export async function getUserCardImagePayload(userId: string, cardId: string) {
  const row = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, cardId), eq(productCards.userId, userId))
  });

  if (!row) {
    return null;
  }

  const card = normalizeCard(row.payload);
  if (!card) {
    return null;
  }

  const access = await getUserDownloadAccess(userId);
  const downloadUnlocked = isGenerationDownloadUnlocked(access, card.id);

  return {
    card,
    downloadUnlocked
  };
}

export async function saveUserCard(userId: string, card: ProductCardResult) {
  const normalized = normalizeCard(card);
  if (!normalized) {
    throw new Error("INVALID_CARD");
  }

  const createdAt = new Date(normalized.generatedAt || Date.now());

  await db
    .insert(productCards)
    .values({
      id: normalized.id,
      userId,
      payload: normalized,
      createdAt
    })
    .onConflictDoUpdate({
      target: productCards.id,
      set: {
        payload: normalized,
        createdAt
      }
    });

  await registerGenerationForCleanDownload(userId, normalized.id, createdAt);

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
