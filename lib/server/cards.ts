import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards } from "@/lib/db/schema";
import { hydrateUserCardsWithVideos } from "@/lib/server/cardVideos";
import { registerGenerationForCleanDownload } from "@/lib/server/downloadAccess";
import { downloadRemoteImageAsBase64 } from "@/lib/server/remoteImage";
import type { ProductCardResult } from "@/types/product-card";

const CARD_LIMIT = 50;

function normalizeCard(card: ProductCardResult): ProductCardResult | null {
  if (!card?.id || !card.title) {
    return null;
  }
  return card;
}

async function persistCardImagePayload(card: ProductCardResult) {
  if (card.generatedImageBase64 && card.generatedImageMimeType) {
    return card;
  }

  if (!card.generatedImageUrl) {
    return card;
  }

  const downloaded = await downloadRemoteImageAsBase64(card.generatedImageUrl);
  if (!downloaded) {
    return card;
  }

  return {
    ...card,
    generatedImageBase64: downloaded.base64,
    generatedImageMimeType: downloaded.mimeType
  };
}

function sanitizeCardForClient(card: ProductCardResult): ProductCardResult {
  const previewImageUrl = `/api/cards/${card.id}/image?variant=preview`;
  const imageDownloadUrl = `/api/cards/${card.id}/image?variant=original&download=1`;

  return {
    ...card,
    downloadUnlocked: true,
    watermarkLocked: false,
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
    (
      await Promise.all(
        rows.map(async (row) => {
          const card = normalizeCard(row.payload);
          if (!card) {
            return null;
          }

          const persisted = await persistCardImagePayload(card);
          if (
            persisted.generatedImageBase64 &&
            persisted.generatedImageBase64 !== card.generatedImageBase64
          ) {
            await db
              .update(productCards)
              .set({ payload: persisted })
              .where(eq(productCards.id, card.id));
          }

          return persisted;
        })
      )
    ).filter((item): item is ProductCardResult => item !== null)
  );

  return cards.map((card) => sanitizeCardForClient(card));
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

  return {
    card,
    downloadUnlocked: true
  };
}

export async function saveUserCard(userId: string, card: ProductCardResult) {
  const normalized = normalizeCard(card);
  if (!normalized) {
    throw new Error("INVALID_CARD");
  }

  const payload = await persistCardImagePayload(normalized);
  const createdAt = new Date(payload.generatedAt || Date.now());

  await db
    .insert(productCards)
    .values({
      id: payload.id,
      userId,
      payload,
      createdAt
    })
    .onConflictDoUpdate({
      target: productCards.id,
      set: {
        payload,
        createdAt
      }
    });

  await registerGenerationForCleanDownload(userId, payload.id, createdAt);

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
