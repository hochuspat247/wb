import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerations } from "@/lib/db/schema";
import { saveUserCard } from "@/lib/server/cards";
import { getUserDownloadAccess, isGenerationDownloadUnlocked, registerGenerationForCleanDownload } from "@/lib/server/downloadAccess";
import { addWatermarkToImageBuffer } from "@/lib/server/watermark";
import type { ProductCardResult } from "@/types/product-card";

const PREVIEW_MIME_TYPE = "image/png";

export type DemoGenerationRecord = typeof demoGenerations.$inferSelect;

export async function createDemoGeneration(input: {
  guestId: string;
  userId?: string | null;
  clientIpHash?: string | null;
  card: ProductCardResult;
  originalImageBase64: string;
  originalImageMimeType: string;
}) {
  const originalBuffer = Buffer.from(input.originalImageBase64, "base64");
  const previewBuffer = await addWatermarkToImageBuffer(originalBuffer);
  const now = new Date();

  const [row] = await db
    .insert(demoGenerations)
    .values({
      id: crypto.randomUUID(),
      guestId: input.guestId,
      userId: input.userId ?? null,
      clientIpHash: input.clientIpHash ?? null,
      status: "done",
      payload: input.card,
      originalImageBase64: input.originalImageBase64,
      originalImageMimeType: input.originalImageMimeType,
      previewImageBase64: previewBuffer.toString("base64"),
      previewImageMimeType: PREVIEW_MIME_TYPE,
      createdAt: now
    })
    .returning();

  return row;
}

export async function getDemoGeneration(id: string) {
  return db.query.demoGenerations.findFirst({
    where: eq(demoGenerations.id, id)
  });
}

export async function attachGuestGenerationsToUser(guestId: string, userId: string) {
  const rows = await db.query.demoGenerations.findMany({
    where: and(eq(demoGenerations.guestId, guestId), isNull(demoGenerations.userId))
  });

  if (!rows.length) {
    return [];
  }

  await db
    .update(demoGenerations)
    .set({ userId })
    .where(and(eq(demoGenerations.guestId, guestId), isNull(demoGenerations.userId)));

  for (const row of rows) {
    const cardId = row.id;
    await registerGenerationForCleanDownload(userId, cardId, row.createdAt);
    await saveUserCard(userId, {
      ...row.payload,
      id: cardId,
      generatedImageBase64: row.originalImageBase64,
      generatedImageMimeType: row.originalImageMimeType,
      generatedImageDataUrl: undefined,
      generatedImageUrl: null
    });
  }

  return rows;
}

export function canReadPreview(row: DemoGenerationRecord, identity: { guestId?: string | null; userId?: string | null }) {
  if (identity.userId && row.userId === identity.userId) {
    return true;
  }

  return Boolean(identity.guestId && row.guestId === identity.guestId);
}

export async function canReadOriginal(row: DemoGenerationRecord, userId?: string | null) {
  if (!userId || row.userId !== userId) {
    return false;
  }

  const access = await getUserDownloadAccess(userId);
  return isGenerationDownloadUnlocked(access, row.id);
}

export async function getDemoPreviewBuffer(row: DemoGenerationRecord, userId?: string | null) {
  if (userId && row.userId === userId) {
    const access = await getUserDownloadAccess(userId);
    if (isGenerationDownloadUnlocked(access, row.id)) {
      return {
        buffer: Buffer.from(row.originalImageBase64, "base64"),
        mimeType: row.originalImageMimeType
      };
    }
  }

  return {
    buffer: Buffer.from(row.previewImageBase64, "base64"),
    mimeType: row.previewImageMimeType
  };
}
