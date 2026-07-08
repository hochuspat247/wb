import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoGenerations, payments, productCards, users } from "@/lib/db/schema";

export type UserDownloadAccess = {
  freeCleanDownloadGenerationId: string | null;
  hasPurchasedGenerationCredits: boolean;
};

export function isGenerationDownloadUnlocked(access: UserDownloadAccess, generationId: string) {
  if (access.hasPurchasedGenerationCredits) {
    return true;
  }

  return access.freeCleanDownloadGenerationId === generationId;
}

export async function getUserDownloadAccess(userId: string): Promise<UserDownloadAccess> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      freeCleanDownloadGenerationId: true,
      hasPurchasedGenerationCredits: true
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    freeCleanDownloadGenerationId: user.freeCleanDownloadGenerationId ?? null,
    hasPurchasedGenerationCredits: Boolean(user.hasPurchasedGenerationCredits)
  };
}

export async function registerGenerationForCleanDownload(
  userId: string,
  generationId: string,
  createdAt: Date
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      freeCleanDownloadGenerationId: true
    }
  });

  if (!user) {
    return;
  }

  const currentId = user.freeCleanDownloadGenerationId;

  if (!currentId) {
    await db
      .update(users)
      .set({ freeCleanDownloadGenerationId: generationId })
      .where(eq(users.id, userId));
    return;
  }

  if (currentId === generationId) {
    return;
  }

  const currentCreatedAt = await getGenerationCreatedAt(userId, currentId);

  if (!currentCreatedAt || createdAt < currentCreatedAt) {
    await db
      .update(users)
      .set({ freeCleanDownloadGenerationId: generationId })
      .where(eq(users.id, userId));
  }
}

export async function unlockAllDownloadsForUser(userId: string) {
  await db
    .update(users)
    .set({ hasPurchasedGenerationCredits: true })
    .where(eq(users.id, userId));
}

export async function syncPurchasedDownloadUnlock(userId: string) {
  const paid = await db.query.payments.findFirst({
    where: and(eq(payments.userId, userId), eq(payments.paid, true), isNotNull(payments.creditedAt)),
    columns: { id: true }
  });

  if (paid) {
    await unlockAllDownloadsForUser(userId);
  }
}

async function getGenerationCreatedAt(userId: string, generationId: string) {
  const demo = await db.query.demoGenerations.findFirst({
    where: and(eq(demoGenerations.id, generationId), eq(demoGenerations.userId, userId)),
    columns: { createdAt: true }
  });

  if (demo?.createdAt) {
    return demo.createdAt;
  }

  const card = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, generationId), eq(productCards.userId, userId)),
    columns: { createdAt: true }
  });

  return card?.createdAt ?? null;
}
